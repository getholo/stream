export default class Users {
  private users: Map<string, string> = new Map();

  upsert(username: string, password: string) {
    this.users.set(username, password);
  }

  get(username: string) {
    return this.users.get(username);
  }
}
