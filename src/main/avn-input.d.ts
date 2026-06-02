declare module 'avn-input' {
  interface AvnInput {
    keyDown(vk: number): void
    keyUp(vk: number): void
    isAdmin(): boolean
    available(): boolean
  }
  const addon: AvnInput | null
  export default addon
}
