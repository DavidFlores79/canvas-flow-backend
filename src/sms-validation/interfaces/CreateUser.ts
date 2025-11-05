import { SmsValidationAction } from '../enum/SmsValidationAction';
import { SmsValidationStatus } from '../enum/SmsValidationStatus';

export interface CreateUser {
  externalUserId: string;
  phone: string;
  twilioServiceSid: string;
  twilioRequestSid: string;
  twilioAction: SmsValidationAction;
  twilioStatus: SmsValidationStatus;
  twilioRequestDate: Date;
  status: string;
}
