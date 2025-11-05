import { SmsValidationAction } from '../enum/SmsValidationAction';
import { SmsValidationStatus } from '../enum/SmsValidationStatus';

export interface SmsValidationInterface {
  id?: string;
  user_id?: string;
  sms_service_sid?: string;
  sms_request_sid?: string;
  sms_action?: SmsValidationAction;
  sms_status?: SmsValidationStatus;
  status?: string;
  phone?: string;
  sms_provider?: string;
  created_at: Date;
  updated_at: Date;
}
