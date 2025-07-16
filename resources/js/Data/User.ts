import { BaseData } from '@/Data/BaseData';
import { User } from '@/types';

export class UserData extends BaseData<User>{
    protected path_api_url: string = 'api.users';
}
