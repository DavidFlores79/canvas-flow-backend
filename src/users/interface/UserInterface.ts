import { Gender, Group } from '../enum/UserEnum';

export interface UserInterface {
  id: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  second_last_name?: string;
  full_name?: string;
  display_name?: string;
  email?: string;
  phone: string;
  password: string;
  gender: Gender;
  group: Group;
  birth_date?: string;
  country_of_birth?: string;
  rfc?: string;
  curp?: string;
  nationality?: string;
  status: string;
  profile_completed: boolean;
  verified: boolean;
  risk_level?: string;
  state_of_birth?: string;
  addresses?: any[];
  created_at: Date;
  updated_at: Date;
}
