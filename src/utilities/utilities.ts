export const uuidv4 = () => {
  // TODO check for browser support for cypto and randomUUID
  return self.crypto.randomUUID();
}