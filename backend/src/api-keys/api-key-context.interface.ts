import { ApiKeyScope } from './api-key-scope.enum';

export interface ApiKeyContext {
  id: string;
  scope: ApiKeyScope;
  building_id?: string;
}
