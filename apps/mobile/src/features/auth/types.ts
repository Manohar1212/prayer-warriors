export type AuthUser = {
  id: string;
  email: string;
  displayName: string | null;
  phone: string | null;
};

export type ProfilePatch = { displayName?: string; phone?: string };

export type AuthService = {
  getCurrentUser(): Promise<AuthUser | null>;
  signIn(email: string, password: string): Promise<AuthUser>;
  signOut(): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  updateProfile(patch: ProfilePatch): Promise<AuthUser>;
};

/** The slice of the Parse SDK the auth service touches. Lets tests inject fakes. */
export type ParseUserLike = {
  id?: string;
  getEmail(): string | null | undefined;
  get(key: string): unknown;
  set(key: string, value: unknown): unknown;
  save(): Promise<unknown>;
};

export type ParseLike = {
  User: {
    currentAsync(): Promise<ParseUserLike | null>;
    logIn(username: string, password: string): Promise<ParseUserLike>;
    logOut(): Promise<unknown>;
    requestPasswordReset(email: string): Promise<unknown>;
  };
};
