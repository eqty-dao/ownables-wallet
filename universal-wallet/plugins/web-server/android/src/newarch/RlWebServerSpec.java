package com.rlwebserver;

import com.facebook.react.bridge.ReactApplicationContext;

abstract class RlWebServerSpec extends NativeRlWebServerSpec {
  RlWebServerSpec(ReactApplicationContext context) {
    super(context);
  }
}
