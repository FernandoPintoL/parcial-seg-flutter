export default interface ResponsiveService {
  isRequest : boolean;
  isSuccess : boolean;
  isMessageError : boolean;
  message: string;
  messageError: string;
  data: any;
  statusCode: number;
}
