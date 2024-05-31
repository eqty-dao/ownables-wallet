
// Static server plugin
#import "GCDWebServer.h"
#import "GCDWebServerFunctions.h"
#import "GCDWebServerFileResponse.h"
#import "GCDWebServerHTTPStatusCodes.h"

#ifdef RCT_NEW_ARCH_ENABLED
#import "RNRlWebServerSpec.h"

@interface RlWebServer : NSObject <NativeRlWebServerSpec>  {
    GCDWebServer* _webServer;
}

@property(nonatomic, retain) NSString *localPath;
@property(nonatomic, retain) NSString *url;

@property (nonatomic, retain) NSString* www_root;
@property (nonatomic, retain) nonnull NSNumber* port;
@property (assign) BOOL localhost_only;
@property (assign) BOOL keep_alive;

#else
#import <React/RCTBridgeModule.h>

@interface RlWebServer : NSObject <RCTBridgeModule> {
    GCDWebServer* _webServer;
}

@property(nonatomic, retain) NSString *localPath;
@property(nonatomic, retain) NSString *url;

@property (nonatomic, retain) NSString* www_root;
@property (nonatomic, retain) NSNumber* port;
@property (assign) BOOL localhost_only;
@property (assign) BOOL keep_alive;

#endif

@end
