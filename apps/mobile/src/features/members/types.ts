export type MemberRole = 'admin' | 'member';

export type Member = {
  id: string;
  userId: string;
  displayName: string;
  role: MemberRole;
  status: 'active' | 'inactive';
  /** E.164, from memberPhones; null when they have not added one. */
  phone: string | null;
};

export type NewMember = { displayName: string; email: string; phone?: string };

export type AddedMember = {
  id: string;
  displayName: string;
  email: string;
  phone: string | null;
  startingPassword: string;
};

/** A GroupMember row as read from Parse, with the user pointer included. */
export type RawMembership = {
  id: string;
  role: string;
  status: string;
  user: { id: string; displayName?: string } | null;
};

export type MembersService = {
  list(): Promise<Member[]>;
  add(input: NewMember): Promise<AddedMember>;
  /** Takes the member out of the group; what they wrote stays, with their name. */
  remove(userId: string): Promise<void>;
};
