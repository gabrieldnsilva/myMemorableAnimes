import { Model, DataTypes, Optional } from "sequelize";
import bcrypt from "bcrypt";
import sequelize from "../config/database";

// User attributes interface
interface UserAttributes {
	id: number;
	name: string;
	email: string;
	password: string;
	avatar?: string;
	bio?: string;
	isActive: boolean;
	lastLogin?: Date;
	createdAt?: Date;
	updatedAt?: Date;
}

// Optional attributes for creation (id is auto-generated)
interface UserCreationAttributes
	extends Optional<
		UserAttributes,
		"id" | "avatar" | "bio" | "isActive" | "lastLogin"
	> {}

class User
	extends Model<UserAttributes, UserCreationAttributes>
	implements UserAttributes
{
	public id!: number;
	public name!: string;
	public email!: string;
	public password!: string;
	public avatar?: string;
	public bio?: string;
	public isActive!: boolean;
	public lastLogin?: Date;
	public readonly createdAt!: Date;
	public readonly updatedAt!: Date;

	/**
	 * Hash the user's password before saving
	 */
	async hashPassword(): Promise<void> {
		const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || "10", 10);
		this.password = await bcrypt.hash(this.password, saltRounds);
	}

	/**
	 * Compare a plain text password with the hashed password
	 */
	async comparePassword(plainPassword: string): Promise<boolean> {
		return bcrypt.compare(plainPassword, this.password);
	}

	/**
	 * Return user data without password
	 */
	toJSON(): Partial<UserAttributes> {
		const values = { ...this.get() } as Partial<UserAttributes>;
		delete (values as { password?: string }).password;
		return values;
	}
}

User.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		name: {
			type: DataTypes.STRING(100),
			allowNull: false,
			validate: {
				notEmpty: { msg: "Name is required" },
				len: {
					args: [2, 100],
					msg: "Name must be between 2 and 100 characters",
				},
			},
		},
		email: {
			type: DataTypes.STRING(255),
			allowNull: false,
			unique: {
				name: "unique_email",
				msg: "Email already exists",
			},
			validate: {
				notEmpty: { msg: "Email is required" },
				isEmail: { msg: "Invalid email format" },
			},
		},
		password: {
			type: DataTypes.STRING(255),
			allowNull: false,
			validate: {
				notEmpty: { msg: "Password is required" },
				len: {
					args: [6, 255],
					msg: "Password must be at least 6 characters",
				},
			},
		},
		avatar: {
			type: DataTypes.STRING(500),
			allowNull: true,
			defaultValue: null,
		},
		bio: {
			type: DataTypes.TEXT,
			allowNull: true,
			defaultValue: null,
			validate: {
				len: {
					args: [0, 500],
					msg: "Bio must be less than 500 characters",
				},
			},
		},
		isActive: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: true,
		},
		lastLogin: {
			type: DataTypes.DATE,
			allowNull: true,
			defaultValue: null,
		},
	},
	{
		sequelize,
		tableName: "users",
		timestamps: true,
		underscored: true,
		hooks: {
			beforeCreate: async (user: User) => {
				await user.hashPassword();
			},
			beforeUpdate: async (user: User) => {
				if (user.changed("password")) {
					await user.hashPassword();
				}
			},
		},
	}
);

export default User;
