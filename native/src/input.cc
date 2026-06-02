#include <napi.h>

#ifdef _WIN32
#include <windows.h>

// Отправляет событие клавиши (down или up) по виртуальному коду через SendInput.
static void SendKey(WORD vk, bool up) {
  INPUT input = {0};
  input.type = INPUT_KEYBOARD;
  input.ki.wVk = vk;
  input.ki.wScan = (WORD)MapVirtualKey(vk, MAPVK_VK_TO_VSC);
  input.ki.dwFlags = up ? KEYEVENTF_KEYUP : 0;
  SendInput(1, &input, sizeof(INPUT));
}

static bool ProcessIsAdmin() {
  BOOL isAdmin = FALSE;
  PSID adminGroup = NULL;
  SID_IDENTIFIER_AUTHORITY ntAuthority = SECURITY_NT_AUTHORITY;
  if (AllocateAndInitializeSid(&ntAuthority, 2, SECURITY_BUILTIN_DOMAIN_RID,
                               DOMAIN_ALIAS_RID_ADMINS, 0, 0, 0, 0, 0, 0,
                               &adminGroup)) {
    CheckTokenMembership(NULL, adminGroup, &isAdmin);
    FreeSid(adminGroup);
  }
  return isAdmin == TRUE;
}
#endif

Napi::Value KeyDown(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
#ifdef _WIN32
  if (info.Length() >= 1 && info[0].IsNumber()) {
    SendKey((WORD)info[0].As<Napi::Number>().Uint32Value(), false);
  }
#endif
  return env.Undefined();
}

Napi::Value KeyUp(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
#ifdef _WIN32
  if (info.Length() >= 1 && info[0].IsNumber()) {
    SendKey((WORD)info[0].As<Napi::Number>().Uint32Value(), true);
  }
#endif
  return env.Undefined();
}

Napi::Value IsAdmin(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
#ifdef _WIN32
  return Napi::Boolean::New(env, ProcessIsAdmin());
#else
  return Napi::Boolean::New(env, false);
#endif
}

// Доступна ли реальная нативная отправка (только Windows).
Napi::Value Available(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
#ifdef _WIN32
  return Napi::Boolean::New(env, true);
#else
  return Napi::Boolean::New(env, false);
#endif
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set("keyDown", Napi::Function::New(env, KeyDown));
  exports.Set("keyUp", Napi::Function::New(env, KeyUp));
  exports.Set("isAdmin", Napi::Function::New(env, IsAdmin));
  exports.Set("available", Napi::Function::New(env, Available));
  return exports;
}

NODE_API_MODULE(avn_input, Init)
