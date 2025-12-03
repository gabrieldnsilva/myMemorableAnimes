import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import Anime from './Anime';

export enum WatchStatus {
  WATCHING = 'watching',
  COMPLETED = 'completed',
  PLAN_TO_WATCH = 'plan-to-watch',
  DROPPED = 'dropped',
  ON_HOLD = 'on-hold',
}

// UserAnimeList attributes interface
interface UserAnimeListAttributes {
  id: number;
  userId: number;
  animeId: number;
  status: WatchStatus;
  isFavorite: boolean;
  rating?: number;
  watchedEpisodes: number;
  notes?: string;
  addedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// Optional attributes for creation
interface UserAnimeListCreationAttributes
  extends Optional<UserAnimeListAttributes, 'id' | 'isFavorite' | 'rating' | 'watchedEpisodes' | 'notes' | 'addedAt'> {}

class UserAnimeList
  extends Model<UserAnimeListAttributes, UserAnimeListCreationAttributes>
  implements UserAnimeListAttributes
{
  public id!: number;
  public userId!: number;
  public animeId!: number;
  public status!: WatchStatus;
  public isFavorite!: boolean;
  public rating?: number;
  public watchedEpisodes!: number;
  public notes?: string;
  public addedAt!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly user?: User;
  public readonly anime?: Anime;
}

UserAnimeList.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    animeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'animes',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    status: {
      type: DataTypes.ENUM(...Object.values(WatchStatus)),
      allowNull: false,
      defaultValue: WatchStatus.PLAN_TO_WATCH,
    },
    isFavorite: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5,
      },
    },
    watchedEpisodes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    addedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'user_anime_lists',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'anime_id'],
      },
      {
        fields: ['user_id', 'status'],
      },
      {
        fields: ['user_id', 'is_favorite'],
      },
    ],
  }
);

// Define associations
UserAnimeList.belongsTo(User, { foreignKey: 'userId', as: 'user' });
UserAnimeList.belongsTo(Anime, { foreignKey: 'animeId', as: 'anime' });

User.hasMany(UserAnimeList, { foreignKey: 'userId', as: 'animeList' });
Anime.hasMany(UserAnimeList, { foreignKey: 'animeId', as: 'userLists' });

export default UserAnimeList;
