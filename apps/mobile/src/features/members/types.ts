export type MemberRole = 'admin' | 'member';

export type Member = {
  id: string;
  userId: string;
  displayName: string;
  role: MemberRole;
  status: 'active' | 'inactive';
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
};
