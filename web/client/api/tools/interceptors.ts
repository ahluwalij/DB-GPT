import { AxiosError } from 'axios';
import { notificationService } from '@/utils/notification';
import { ApiResponse, FailedTuple, ResponseType, SuccessTuple } from '../';

/**
 * Response processing
 *
 * @param promise request
 * @param ignoreCodes ignore error codes
 * @returns
 */
export const apiInterceptors = <T = any, D = any>(
  promise: Promise<ApiResponse<T, D>>,
  ignoreCodes?: '*' | (number | string)[],
) => {
  return promise
    .then<SuccessTuple<T, D>>(response => {
      const { data } = response;
      if (!data) {
        throw new Error('Network Error!');
      }
      if (!data.success) {
        if (ignoreCodes === '*' || (data.err_code && ignoreCodes && ignoreCodes.includes(data.err_code))) {
          return [null, data.data, data, response];
        } else {
          notificationService.error({
            message: `Request error`,
            description: data?.err_msg ?? 'The interface is abnormal. Please try again later',
          });
        }
      }
      return [null, data.data, data, response];
    })
    .catch<FailedTuple<T, D>>((err: Error | AxiosError<T, D>) => {
      let errMessage = err.message;
      if (err instanceof AxiosError) {
        if (err.code === 'ERR_NETWORK' || err.code === 'ERR_CONNECTION_REFUSED') {
          errMessage = 'Unable to connect to the server. Please ensure the backend service is running.';
        } else {
          try {
            const { err_msg } = JSON.parse(err.request.response) as ResponseType<null>;
            err_msg && (errMessage = err_msg);
          } catch {
            /* empty */
          }
        }
      }
      notificationService.error({
        message: `Request error`,
        description: errMessage,
      });
      return [err, null, null, null];
    });
};
