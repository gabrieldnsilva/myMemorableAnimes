import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

// Anime attributes interface
interface AnimeAttributes {
  id: number;
  title: string;
  synopsis: string;
  genre: string;
  year: string;
  rating: string;
  duration: string;
  imageUrl: string;
  backgroundImage: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Optional attributes for creation (id is auto-generated)
interface AnimeCreationAttributes extends Optional<AnimeAttributes, 'id'> {}

class Anime extends Model<AnimeAttributes, AnimeCreationAttributes> implements AnimeAttributes {
  public id!: number;
  public title!: string;
  public synopsis!: string;
  public genre!: string;
  public year!: string;
  public rating!: string;
  public duration!: string;
  public imageUrl!: string;
  public backgroundImage!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Anime.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Title is required' },
      },
    },
    synopsis: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    genre: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    year: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    rating: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    duration: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    imageUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    backgroundImage: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'animes',
    timestamps: true,
    underscored: true,
  }
);

export default Anime;
