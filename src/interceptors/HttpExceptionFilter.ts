import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { map } from './httpExceptionMap';

@Injectable()
export class HttpExceptionFilter implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Error> {
    // next.handle() is an Observable of the controller's result value
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return next.handle().pipe(
      catchError((error: Error) => {
        const mapedError = map.get(error.constructor.name);
        if (mapedError) {
          throw new mapedError(error.message);
        }

        throw error;
      }),
    );
  }
}
