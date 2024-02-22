export default class RserveError extends Error {
  name: string;
  status_code: number;

  constructor(message: string, status_code?: number) {
    super(message);
    this.name = "RserveError";
    this.status_code = status_code ?? 0;
  }
}
