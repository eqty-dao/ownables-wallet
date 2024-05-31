#import "RlWebServer.h"

@implementation RlWebServer
@synthesize bridge = _bridge;

RCT_EXPORT_MODULE();

- (instancetype)init {
    if((self = [super init])) {

        [GCDWebServer self];
        _webServer = [[GCDWebServer alloc] init];
    }
    return self;
}

- (void)dealloc {

    if(_webServer.isRunning == YES) {
        [_webServer stop];
    }
    _webServer = nil;

}

- (dispatch_queue_t)methodQueue
{
    return dispatch_queue_create("com.rlwebserver", DISPATCH_QUEUE_SERIAL);
}


RCT_EXPORT_METHOD(start: (nonnull NSNumber *)port
                  root:(NSString *)optroot
                  options:(NSDictionary *)options
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {

    NSString * root;

    if( [optroot isEqualToString:@"DocumentDir"] ){
        root = [NSString stringWithFormat:@"%@", [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) objectAtIndex:0] ];
    } else if( [optroot isEqualToString:@"BundleDir"] ){
        root = [NSString stringWithFormat:@"%@", [[NSBundle mainBundle] bundlePath] ];
    } else if([optroot hasPrefix:@"/"]) {
        root = optroot;
    } else {
        root = [NSString stringWithFormat:@"%@/%@", [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) objectAtIndex:0], optroot ];
    }


    if(root && [root length] > 0) {
        self.www_root = root;
    }
    
    if ( port == 0 ) {
        self.port = [NSNumber numberWithInt:-1];
    }else {
        self.port = port;
    }
    
    self.keep_alive = [options objectForKey:@"keepAlive"] ? [options[@"keepAlive"] boolValue] : NO;
    
    self.localhost_only = [options objectForKey:@"localOnly"] ? [options[@"localOnly"] boolValue] : NO;

    if(_webServer.isRunning != NO) {
            NSLog(@"StaticServer already running at %@", self.url);
            resolve(self.url);
            return;
        }

        NSString *basePath = @"/";
        NSString *directoryPath = self.www_root;
        NSString *indexFilename = @"index.html";
        NSUInteger cacheAge = 0;
        BOOL allowRangeRequests = YES;
        [_webServer addHandlerWithMatchBlock:^GCDWebServerRequest*(NSString* requestMethod, NSURL* requestURL, NSDictionary<NSString*, NSString*>* requestHeaders, NSString* urlPath, NSDictionary<NSString*, NSString*>* urlQuery) {
            if (![requestMethod isEqualToString:@"GET"]) {
              return nil;
            }
            if (![urlPath hasPrefix:basePath]) {
              return nil;
            }
            return [[GCDWebServerRequest alloc] initWithMethod:requestMethod url:requestURL headers:requestHeaders path:urlPath query:urlQuery];
          }
          processBlock:^GCDWebServerResponse*(GCDWebServerRequest* request) {
            GCDWebServerResponse* response = nil;
            NSString* filePath = [directoryPath stringByAppendingPathComponent:GCDWebServerNormalizePath([request.path substringFromIndex:basePath.length])];
            NSString* fileType = [[[NSFileManager defaultManager] attributesOfItemAtPath:filePath error:NULL] fileType];
            if (fileType) {
              if ([fileType isEqualToString:NSFileTypeDirectory]) {
                if (indexFilename) {
                  NSString* indexPath = [filePath stringByAppendingPathComponent:indexFilename];
                  NSString* indexType = [[[NSFileManager defaultManager] attributesOfItemAtPath:indexPath error:NULL] fileType];
                  if ([indexType isEqualToString:NSFileTypeRegular]) {
                    response = [GCDWebServerFileResponse responseWithFile:indexPath];
                  }
                } else {
                  response = [GCDWebServerResponse responseWithStatusCode:kGCDWebServerHTTPStatusCode_NotFound];
                }
              } else if ([fileType isEqualToString:NSFileTypeRegular]) {
                if (allowRangeRequests) {
                  response = [GCDWebServerFileResponse responseWithFile:filePath byteRange:request.byteRange];
                  [response setValue:@"bytes" forAdditionalHeader:@"Accept-Ranges"];
                } else {
                  response = [GCDWebServerFileResponse responseWithFile:filePath];
                }
              }
            }
            if (response) {
              response.cacheControlMaxAge = cacheAge;
              [response setValue:@"GET" forAdditionalHeader:@"Access-Control-Request-Method"];
              [response setValue:@"OriginX-Requested-With, Content-Type, Accept, Cache-Control, Range,Access-Control-Allow-Origin"  forAdditionalHeader:@"Access-Control-Request-Headers"];
              [response setValue: @"*" forAdditionalHeader:@"Access-Control-Allow-Origin"];
            } else {
              response = [GCDWebServerResponse responseWithStatusCode:kGCDWebServerHTTPStatusCode_NotFound];
            }
            return response;
          }];

        NSError *error;
        NSMutableDictionary* _others = [NSMutableDictionary dictionary];


        NSLog(@"Started StaticServer on port %@", self.port);

        if (![self.port isEqualToNumber:[NSNumber numberWithInt:-1]]) {
            [_others setObject:self.port forKey:GCDWebServerOption_Port];
        } else {
            [_others setObject:[NSNumber numberWithInteger:8080] forKey:GCDWebServerOption_Port];
        }

        if (self.localhost_only == YES) {
            [_others setObject:@(YES) forKey:GCDWebServerOption_BindToLocalhost];
        }

        if (self.keep_alive == YES) {
            [_others setObject:@(NO) forKey:GCDWebServerOption_AutomaticallySuspendInBackground];
            [_others setObject:@2.0 forKey:GCDWebServerOption_ConnectedStateCoalescingInterval];
        }


        if([_webServer startWithOptions:_others error:&error]) {
            NSNumber *listenPort = [NSNumber numberWithUnsignedInteger:_webServer.port];
            self.port = listenPort;

            if(_webServer.serverURL == NULL) {
                reject(@"server_error", @"StaticServer could not start", error);
            } else {
                self.url = [NSString stringWithFormat: @"%@://%@:%@", [_webServer.serverURL scheme], [_webServer.serverURL host], [_webServer.serverURL port]];
                NSLog(@"Started StaticServer at URL %@", self.url);
                resolve(self.url);
            }
        } else {
            NSLog(@"Error starting StaticServer: %@", error);

            reject(@"server_error", @"StaticServer could not start", error);

        }

    }

    RCT_EXPORT_METHOD(stop) {
        if(_webServer.isRunning == YES) {

            [_webServer stop];

            NSLog(@"StaticServer stopped");
        }
    }

    RCT_EXPORT_METHOD(origin:(RCTPromiseResolveBlock)resolve
                     rejecter:(RCTPromiseRejectBlock)reject) {
        if(_webServer.isRunning == YES) {
            resolve(self.url);
        } else {
            resolve(@"");
        }
    }

    RCT_EXPORT_METHOD(isRunning:(RCTPromiseResolveBlock)resolve
                     rejecter:(RCTPromiseRejectBlock)reject) {
        bool isRunning = _webServer != nil &&_webServer.isRunning == YES;
        resolve(@(isRunning));
    }

    + (BOOL)requiresMainQueueSetup
    {
        return YES;
    }


// Don't compile this code when we build for the old architecture.
#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeRlWebServerSpecJSI>(params);
}
#endif

@end
