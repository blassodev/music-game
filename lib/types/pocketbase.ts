/**
 * This file was @generated using pocketbase-typegen
 */

import type PocketBase from "pocketbase";
import type { RecordService } from "pocketbase";

export enum Collections {
  Authorigins = "_authOrigins",
  Externalauths = "_externalAuths",
  Mfas = "_mfas",
  Otps = "_otps",
  Superusers = "_superusers",
  Cards = "cards",
  Decks = "decks",
  Songs = "songs",
  Users = "users",
}

// Alias types for improved usability
export type IsoDateString = string;
export type RecordIdString = string;
export type HTMLString = string;

type ExpandType<T> = unknown extends T
  ? T extends unknown
    ? { expand?: unknown }
    : { expand: T }
  : { expand: T };

// System fields
export type BaseSystemFields<T = unknown> = {
  id: RecordIdString;
  collectionId: string;
  collectionName: Collections;
} & ExpandType<T>;

export type AuthSystemFields<T = unknown> = {
  email: string;
  emailVisibility: boolean;
  username: string;
  verified: boolean;
} & BaseSystemFields<T>;

// Record types for each collection

export type AuthoriginsRecord = {
  collectionRef: string;
  created?: IsoDateString;
  fingerprint: string;
  id: string;
  recordRef: string;
  updated?: IsoDateString;
};

export type ExternalauthsRecord = {
  collectionRef: string;
  created?: IsoDateString;
  id: string;
  provider: string;
  providerId: string;
  recordRef: string;
  updated?: IsoDateString;
};

export type MfasRecord = {
  collectionRef: string;
  created?: IsoDateString;
  id: string;
  method: string;
  recordRef: string;
  updated?: IsoDateString;
};

export type OtpsRecord = {
  collectionRef: string;
  created?: IsoDateString;
  id: string;
  password: string;
  recordRef: string;
  sentTo?: string;
  updated?: IsoDateString;
};

export type SuperusersRecord = {
  created?: IsoDateString;
  email: string;
  emailVisibility?: boolean;
  id: string;
  password: string;
  tokenKey: string;
  updated?: IsoDateString;
  verified?: boolean;
};

export enum CardsTypeOptions {
  "ost" = "ost",
  "song" = "song",
  "opening" = "opening",
  "ad" = "ad",
}
export type CardsRecord = {
  ad?: string;
  created?: IsoDateString;
  id: string;
  opening?: string;
  ost?: string;
  song: RecordIdString;
  type: CardsTypeOptions;
  updated?: IsoDateString;
  year?: string;
};

export type DecksRecord = {
  cards?: RecordIdString[];
  created?: IsoDateString;
  description?: string;
  id: string;
  isActive?: boolean;
  name: string;
  updated?: IsoDateString;
};

export type SongsRecord = {
  album: string;
  artist?: string;
  audio: string;
  createdAt?: IsoDateString;
  id: string;
  title: string;
  updatedAt?: IsoDateString;
  year: number;
};

export type UsersRecord = {
  created?: IsoDateString;
  email: string;
  emailVisibility?: boolean;
  id: string;
  password: string;
  tokenKey: string;
  updated?: IsoDateString;
  verified?: boolean;
};

// Response types include system fields and match responses from the PocketBase API
export type AuthoriginsResponse<Texpand = unknown> =
  Required<AuthoriginsRecord> & BaseSystemFields<Texpand>;
export type ExternalauthsResponse<Texpand = unknown> =
  Required<ExternalauthsRecord> & BaseSystemFields<Texpand>;
export type MfasResponse<Texpand = unknown> = Required<MfasRecord> &
  BaseSystemFields<Texpand>;
export type OtpsResponse<Texpand = unknown> = Required<OtpsRecord> &
  BaseSystemFields<Texpand>;
export type SuperusersResponse<Texpand = unknown> = Required<SuperusersRecord> &
  AuthSystemFields<Texpand>;
export type CardsResponse<Texpand = unknown> = Required<CardsRecord> &
  BaseSystemFields<Texpand>;
export type DecksResponse<Texpand = unknown> = Required<DecksRecord> &
  BaseSystemFields<Texpand>;
export type SongsResponse<Texpand = unknown> = Required<SongsRecord> &
  BaseSystemFields<Texpand>;
export type UsersResponse<Texpand = unknown> = Required<UsersRecord> &
  AuthSystemFields<Texpand>;

// Types containing all Records and Responses, useful for creating typing helper functions

export type CollectionRecords = {
  _authOrigins: AuthoriginsRecord;
  _externalAuths: ExternalauthsRecord;
  _mfas: MfasRecord;
  _otps: OtpsRecord;
  _superusers: SuperusersRecord;
  cards: CardsRecord;
  decks: DecksRecord;
  songs: SongsRecord;
  users: UsersRecord;
};

export type CollectionResponses = {
  _authOrigins: AuthoriginsResponse;
  _externalAuths: ExternalauthsResponse;
  _mfas: MfasResponse;
  _otps: OtpsResponse;
  _superusers: SuperusersResponse;
  cards: CardsResponse;
  decks: DecksResponse;
  songs: SongsResponse;
  users: UsersResponse;
};

// Type for usage with type asserted PocketBase instance
// https://github.com/pocketbase/js-sdk#specify-typescript-definitions

export type TypedPocketBase = PocketBase & {
  collection(idOrName: "_authOrigins"): RecordService<AuthoriginsResponse>;
  collection(idOrName: "_externalAuths"): RecordService<ExternalauthsResponse>;
  collection(idOrName: "_mfas"): RecordService<MfasResponse>;
  collection(idOrName: "_otps"): RecordService<OtpsResponse>;
  collection(idOrName: "_superusers"): RecordService<SuperusersResponse>;
  collection(idOrName: "cards"): RecordService<CardsResponse>;
  collection(idOrName: "decks"): RecordService<DecksResponse>;
  collection(idOrName: "songs"): RecordService<SongsResponse>;
  collection(idOrName: "users"): RecordService<UsersResponse>;
};
