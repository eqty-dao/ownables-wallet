package com.rlwebserver;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;

import java.io.File;
import java.io.IOException;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.ServerSocket;
import java.net.SocketException;
import java.util.Enumeration;

import fi.iki.elonen.SimpleWebServer;

public class RlWebServerModule extends com.rlwebserver.RlWebServerSpec implements LifecycleEventListener {
  public static final String NAME = "RlWebServer";
  private ReactApplicationContext reactContext;
  private SimpleWebServer server = null;
  private String url = "";
  private String localPath = "";
  private File wwwRoot = null;
  private int port = 9999;
  private boolean localHostOnly = false;
  private boolean keepAlive = false;

  RlWebServerModule(ReactApplicationContext context) {
    super(context);
    this.reactContext = context;
  }

  @Override
  @NonNull
  public String getName() {
    return NAME;
  }


  // Example method
  // See https://reactnative.dev/docs/native-modules-android
  @ReactMethod
  public void start(int serverPort, String path, ReadableMap options, Promise promise) {
    if ( server != null ){
      promise.resolve(url);
      return;
    }

    localHostOnly = options.hasKey("localOnly") ? options.getBoolean("localOnly") : false;
    keepAlive = options.hasKey("keepAlive") ? options.getBoolean("keepAlive") : false;
    port = serverPort == 0 ? this.findRandomOpenPort() :  serverPort;
    wwwRoot = path != null && ( path.startsWith("/") || path.startsWith("file:///") ) ? new File(path) : new File(this.reactContext.getFilesDir(), path);
    localPath = wwwRoot.getAbsolutePath();

    try {
      server = localHostOnly ? new WebServer("localhost", port, wwwRoot) : new WebServer(__getLocalIpAddress(), port, wwwRoot);
      url = localHostOnly ? "http://localhost:" + port : "http://" + __getLocalIpAddress() + ":" + port;
      server.start();
      promise.resolve(url);
    } catch (IOException e){
      String msg = e.getMessage();

      // Server doesn't stop on refresh
      if (server != null && msg.equals("bind failed: EADDRINUSE (Address already in use)")){
        promise.resolve(url);
      } else {
        promise.reject(null, msg);
      }
    }

  }

  @ReactMethod
  public void stop() {
    if (server != null) {
      server.stop();
      server = null;
    }
  }

  @ReactMethod
  public void origin(Promise promise) {
    promise.resolve(server != null ? url : "");
  }

  @ReactMethod
  public void isRunning(Promise promise) {
    promise.resolve(server != null && server.isAlive());
  }

  private Integer findRandomOpenPort()  {
    try {
      ServerSocket socket = new ServerSocket(0);
      int port = socket.getLocalPort();
      socket.close();
      return port;
    } catch (IOException e) {
      return 0;
    }
  }

  private String __getLocalIpAddress() {
    try {
      for (Enumeration<NetworkInterface> en = NetworkInterface.getNetworkInterfaces(); en.hasMoreElements();) {
        NetworkInterface intf = en.nextElement();
        for (Enumeration<InetAddress> enumIpAddr = intf.getInetAddresses(); enumIpAddr.hasMoreElements();) {
          InetAddress inetAddress = enumIpAddr.nextElement();
          if (! inetAddress.isLoopbackAddress()) {
            String ip = inetAddress.getHostAddress();
            if(Utils.isIPv4Address(ip)) {
              return ip;
            }
          }
        }
      }
    } catch (SocketException ex) {
    }

    return "127.0.0.1";
  }

  /* Shut down the server if app is destroyed or paused */
  @Override
  public void onHostResume() {
    // do nothing
  }

  @Override
  public void onHostPause() {
    if(!keepAlive){
      stop();
    }
  }

  @Override
  public void onHostDestroy() {
    stop();
  }

}
