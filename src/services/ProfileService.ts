import User from "../models/User";
import UserAnimeList from "../models/UserAnimeList";

interface UpdateProfileData {
	name?: string;
	email?: string;
	bio?: string;
	avatar?: string;
}

interface ChangePasswordData {
	oldPassword: string;
	newPassword: string;
}

interface UserStats {
	totalAnimes: number;
	favoriteCount: number;
	joinedDays: number;
}

 export class ProfileService {
	/**
	 * Get user statistics
	 */
	async getUserStats(userId: number): Promise<UserStats> {
		const user = await User.findByPk(userId);

		if (!user) {
			throw new Error("User not found");
		}

		// Calculate days since joined
		const joinedDays = Math.floor(
			(Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
		);

		// Get anime statistics from UserAnimeList
		const totalAnimes = await UserAnimeList.count({
			where: { userId },
		});

		const favoriteCount = await UserAnimeList.count({
			where: { userId, isFavorite: true },
		});

		const stats: UserStats = {
			totalAnimes,
			favoriteCount,
			joinedDays,
		};

		return stats;
	}

	/**
	 * Update user profile data
	 */
	async updateUserData(
		userId: number,
		data: UpdateProfileData
	): Promise<User> {
		const user = await User.findByPk(userId);

		if (!user) {
			throw new Error("User not found");
		}

		// Check if email is being changed and if it's already in use
		if (data.email && data.email !== user.email) {
			const existingUser = await User.findOne({
				where: { email: data.email },
			});
			if (existingUser) {
				throw new Error("Email already in use");
			}
		}

		// Update fields
		if (data.name) user.name = data.name;
		if (data.email) user.email = data.email;
		if (data.bio !== undefined) user.bio = data.bio;
		if (data.avatar !== undefined) user.avatar = data.avatar;

		await user.save();
		return user;
	}

	/**
	 * Change user password
	 */
	async changePassword(
		userId: number,
		data: ChangePasswordData
	): Promise<void> {
		const user = await User.findByPk(userId);

		if (!user) {
			throw new Error("User not found");
		}

		// Verify old password
		const isValidPassword = await user.comparePassword(data.oldPassword);
		if (!isValidPassword) {
			throw new Error("Current password is incorrect");
		}

		// Update password (will be hashed by beforeUpdate hook)
		user.password = data.newPassword;
		await user.save();
	}

	/**
	 * Deactivate user account (soft delete)
	 */
	async deactivateAccount(userId: number): Promise<void> {
		const user = await User.findByPk(userId);

		if (!user) {
			throw new Error("User not found");
		}

		user.isActive = false;
		await user.save();
	}

	/**
	 * Update last login timestamp
	 */
	async updateLastLogin(userId: number): Promise<void> {
		const user = await User.findByPk(userId);

		if (!user) {
			throw new Error("User not found");
		}

		user.lastLogin = new Date();
		await user.save();
	}

	/**
	 * Get full user profile with stats
	 */
	async getFullProfile(
		userId: number
	): Promise<{ user: User; stats: UserStats }> {
		const user = await User.findByPk(userId);

		if (!user) {
			throw new Error("User not found");
		}

		if (!user.isActive) {
			throw new Error("Account is deactivated");
		}

		const stats = await this.getUserStats(userId);

		return { user, stats };
	}
}

export default new ProfileService();
