/** The slice of expo-sqlite the Bible service uses. */
export type BibleDb = {
  getAllAsync<T>(sql: string, params?: (string | number)[]): Promise<T[]>;
  getFirstAsync<T>(sql: string, params?: (string | number)[]): Promise<T | null>;
};
