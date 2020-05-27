export class BaseManager {
  public register(manager: string, instance: BaseManager) {
    this[manager] = instance;
  } 
}