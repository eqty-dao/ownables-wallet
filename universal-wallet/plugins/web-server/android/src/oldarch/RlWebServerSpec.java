package com.rlwebserver;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReadableMap;

import java.io.IOException;

abstract class RlWebServerSpec extends ReactContextBaseJavaModule {
  RlWebServerSpec(ReactApplicationContext context) {
    super(context);
  }

  public abstract void start(int serverPort, String path, ReadableMap options, Promise promise) throws IOException;
}
