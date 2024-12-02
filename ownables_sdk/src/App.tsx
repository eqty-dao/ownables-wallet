import { useEffect, useState } from "react";
import { Badge, Box, Dialog, DialogContent, DialogContentText, LinearProgress } from "@mui/material";
import IDBService from "./services/IDB.service";
import { TypedPackage } from "./interfaces/TypedPackage";
import Loading from "./components/Loading";
import LTOService from "./services/LTO.service";
import OwnableService from "./services/Ownable.service";
import If from "./components/If";
import PackageService from "./services/Package.service";
import Grid from "@mui/material/Unstable_Grid2";
import * as React from "react";
import { EventChain } from "@ltonetwork/lto";
import { AlertColor } from "@mui/material/Alert/Alert";
import ownableErrorMessage from "./utils/ownableErrorMessage";
import ConfirmDialog from "./components/ConfirmDialog";
import { SnackbarProvider, enqueueSnackbar } from "notistack";
import { TypedOwnableInfo } from "./interfaces/TypedOwnableInfo";
import OwnableDetailsModal from "./components/DetailsModal/OwnableDetailsModal";
import OwnableThumb from "./components/DetailsModal/OwnableThumb";
import { themeColors } from "./theme/themeColors";
import AlertDrawer from "./components/DetailsModal/AlertDrawer";
import ConfirmDrawer from "./components/DetailsModal/ConfirmDrawer";
import LtoOverlay from "./components/DetailsModal/LtoOverlay";
import LtoSearchBar from "./components/DetailsModal/LtoSearchBar";

// DC: Fab button
import Fab from "./components/Fab";
import { HomePageEnums } from "./enums/HomePageActions";
import { ReactComponent as PlusIcon } from "./assets/plus_icon.svg";
import { ReactComponent as CloseIcon } from "./assets/close_icon.svg";
import { ReactComponent as CreateIcon } from "./assets/create_icon.svg";
import { ReactComponent as CollectionIcon } from "./assets/collection-icon.svg";
import { ReactComponent as ReceiveIcon } from "./assets/receive_icon.svg";
import TypedFabItem from "./interfaces/TypedFabItem";
import CollectionService, {
  StaticCollections,
} from "./services/Collection.service";
import FiltersDrawer from "./components/FiltersDrawer";
import { useFilters } from "./context/FilterContext";
import { useCollections } from "./context/CollectionsContext";
import CollectionTitle from "./components/common/CollectionTitle";
import { useIssuers } from "./context/IssuersContext";
import CreateCollectionDrawer from "./components/CreateCollectionDrawer";
import OwnablesTabs, { TabType } from "./components/OwnablesTabs";
import EmptyCollection from "./components/common/EmptyCollection";
import FilterService from "./services/Filter.service";
import DeleteOwnableOverlay from "./components/DeleteOwnableOverlay";
import CreateOwnablesDrawer from "./components/CreateOwnablesDrawer";
import { CheckForMessages } from "./services/CheckMessages.service";
import { sendRNPostMessage } from "./utils/postMessage";
import AppLinearProgress from "./components/LinearProgress";
import LocalStorageService from "./services/LocalStorage.service";
import { InfoSharp } from "@mui/icons-material";
import ActivityLogDrawer from "./components/ActivityLogs";
import { activityLogService } from "./services/ActivityLog.service";
import { PollingService } from "./services/Polling.service";

interface SelectedOwnable {
  chain: EventChain;
  packageCid: string;
}

const gridStyle = {
  maxWidth: 1400,
  paddingLeft: "16px",
  paddingRight: "16px",
};

interface ReRenderTriggers {
  [key: string]: number;
}

const snackbarDuration = 500;

const searchBarContainerStyle = {
  position: "fixed" as "fixed",
  top: 0,
  left: 0,
  right: 0,
  zIndex: 1000,
  backgroundColor: themeColors.darkBg,
  paddingBottom: "15px",
};

const contentContainerStyle = {
  marginTop: "80px",
};

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [showPackages, setShowPackages] = React.useState(false);
  const [openFab, setOpenFab] = React.useState(false);
  const [ownables, setOwnables] = useState<
    Array<{ chain: EventChain; package: string }>
  >([]);
  const [filteredOwnables, setFilteredOwnables] = useState<
    Array<{ chain: EventChain; package: string }>
  >([]);
  const [foundOwnables, setFoundOwnables] = useState<
    Array<{ chain: EventChain; package: string }>
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = React.useState(false);

  // DC: Collection drawer
  const [showCollectionDrawer, setShowCollectionDrawer] = useState(false);

  // CST: Create ownable drawer
  const [showCreateOwnableDrawer, setShowCreateOwnableDrawer] = useState(false);
  const [showActivityLogDrawer, setShowActivityLogDrawer] = useState(false);
  const [message, setMessages] = useState(0);
  const [importingOwnables, setImportingFromRelay] = useState(false);
  const [importLabel, setImportLabel] = useState("Importing Ownables");


  // DC: filters
  const {
    collection,
    issuer,
    type,
    filteredPackages,
    filterBy,
    isFiltering,
    resetFilter,
    getCollectionName,
    selectedTab,
    setSelectedTab,
    changeCollection,
  } = useFilters();
  const { getAll, addTo, isUpdatingCollection } = useCollections();
  const { getAllIssuers } = useIssuers();

  const computeFilters = (packages: Array<string>) => {
    //const flatMap = packages.flatMap(item => item)
    try {
      const foundOwnables = ownables.filter((item: any) =>
        packages.some((chainId: string) => chainId === item.chain.id)
      );
      setFilteredOwnables(foundOwnables);
      setFoundOwnables(foundOwnables);
    } catch (error) {
      console.error("Error filtering ownables", error);
    }
  };

  const initializeCollections = async () => {
    try {
      CollectionService.init();
      // do a initial search to fill filteredPackages
      filterBy("", "", StaticCollections.ALL);
      // get all collections after initialize
      getAll();
      getAllIssuers();
      // reset filter
      resetFilter();
    } catch (error) {
      console.error("Error initializing collections", error);
    }
  };

  useEffect(() => {
    computeFilters(filteredPackages);
    // eslint-disable-next-line
  }, [filteredPackages, ownables]);

  const [consuming, setConsuming] = useState<{
    chain: EventChain;
    package: string;
    info: TypedOwnableInfo;
  } | null>(null);
  const [alert, setAlert] = useState<{
    title: string;
    message: React.ReactNode;
    severity: AlertColor;
  } | null>(null);
  const [confirm, setConfirm] = useState<{
    title: string;
    message: React.ReactNode;
    severity?: AlertColor;
    ok?: string;
    onConfirm: () => void;
  } | null>(null);


  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const seed = queryParams.get("seed");

    if (seed) {
      sendRNPostMessage(JSON.stringify({ type: 'seed', data: seed }));
      try {
        LTOService.importAccount();
        if (LTOService.isUnlocked()) {
          console.log(`SETTING ADDRESS: ${LTOService.address}`);
          sendRNPostMessage(JSON.stringify({ type: 'WalletFromApp', data: LTOService.address }));
        }
        IDBService.open()
          .then(() => OwnableService.loadAll())
          .then((ownables) => setOwnables(ownables))
          .then(() => setLoaded(true)).finally(() => {
            setLoaded(true);
            sendRNPostMessage(JSON.stringify({ type: 'loaded' }));
          });
        return () => { }
        // check for messages every 5 seconds
      } catch (error) {
        console.error("Error importing account: ", error);
      }
    } else {
      console.log("NO SEED RECEIVED");
    }
  }, []);

  useEffect(() => {
    handleSearch("");
    handleClearSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownables]);

  useEffect(() => {
    initializeCollections();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (LTOService.address.length > 1) {
      const stopPolling = PollingService.startPolling(
        LTOService.address,
        (newCount: any) => {
          setMessages(newCount);
        },
        5000
      );
      return () => stopPolling();
    }
  }, [LTOService.address]);

  const deleteOwnable = async (id: string, packageCid: string) => {
    const pkg = PackageService.info(packageCid);
    setOwnables(() => ownables.filter((ownable) => ownable.chain.id !== id));
    await OwnableService.delete(id);
    enqueueSnackbar(`${pkg?.title} has been deleted`, {
      autoHideDuration: snackbarDuration,
      style: {
        backgroundColor: themeColors.error,
        color: "white",
      },
    });
  };

  const showError = (title: string, message: string) => {
    setAlert({ severity: "error", title, message });
  };


  const canConsume = async (consumer: {
    chain: EventChain;
    package: string;
  }): Promise<boolean> => {
    try {
      return (
        !!consuming?.info &&
        (await OwnableService.canConsume(consumer, consuming!.info))
      );
    } catch (e) {
      console.error(e, (e as any).cause);
      return false;
    }
  };

  const consume = (consumer: EventChain, consumable: EventChain) => {
    const consumableOwnable = ownables.find(
      (ownable) => ownable.chain.id === consumable.id
    );
    if (!consumableOwnable) return;
    if (!consumableOwnable.package) return;
    if (consumer.id === consumable.id) return;

    OwnableService.consume(consumer, consumable)
      .then(() => {
        setConsuming(null);
        setOwnables([]);
        OwnableService.loadAll().then((ownables) => setOwnables(ownables));
        enqueueSnackbar("Consumed", {
          variant: "success",
          autoHideDuration: snackbarDuration,
        }); // consumableOwnable.package
        addTo(StaticCollections.CONSUMED, consumableOwnable.chain.id);
      })
      .catch((error) =>
        showError("Consume failed", ownableErrorMessage(error))
      );
  };

  //Todo: [HIGH] discuss this function with the team
  // const reset = async () => {
  //   if (ownables.length === 0) return;

  //   setConfirm({
  //     severity: "error",
  //     title: "Confirm delete",
  //     message: (
  //       <span>
  //         Are you sure you want to delete <strong>all Ownables</strong>?
  //       </span>
  //     ),
  //     ok: "Delete all",
  //     onConfirm: async () => {
  //       setOwnables([]);
  //       await OwnableService.deleteAll();
  //       enqueueSnackbar("All Ownables are deleted", {
  //         autoHideDuration: snackbarDuration,
  //       });
  //     },
  //   });
  // };

  //Todo: [HIGH] discuss this function with the team
  // const factoryReset = async () => {
  //   setConfirm({
  //     severity: "error",
  //     title: "Factory reset",
  //     message: (
  //       <span>
  //         Are you sure you want to delete all Ownables, all packages and your
  //         account? <strong>This is a destructive action.</strong>
  //       </span>
  //     ),
  //     ok: "Delete everything",
  //     onConfirm: async () => {
  //       setLoaded(false);

  //       LocalStorageService.clear();
  //       SessionStorageService.clear();
  //       await IDBService.deleteDatabase();

  //       window.location.reload();
  //     },
  //   });
  // };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOwnable, setSelectedOwnable] =
    useState<SelectedOwnable | null>(null);

  const openModalWithOwnable = (selectedOwnable: SelectedOwnable) => {
    handleClearSearch();
    setSelectedOwnable(selectedOwnable);
    setIsModalOpen(true);
  };

  const [reRenderTriggers, setReRenderTriggers] = useState<ReRenderTriggers>(
    {}
  );

  const closeModalAndUpdate = (
    selectedOwnable: SelectedOwnable,
    shouldRefresh: boolean
  ) => {
    setIsModalOpen(false);
    if (shouldRefresh) {
      setReRenderTriggers((prev) => ({
        ...prev,
        [selectedOwnable.chain.id]: (prev[selectedOwnable.chain.id] || 0) + 1,
      }));
      // DC: refresh ownables after looking details
      if (collection === StaticCollections.ALL) {
        initializeCollections();
        return;
      }

      // DC: refresh collection only
      filterBy(issuer, type, collection);
    }
  };

  const onConsumeTapped = (info: TypedOwnableInfo) => {
    if (selectedOwnable === null) return;
    setOwnables([]);
    OwnableService.loadAll().then((ownables) => setOwnables(ownables));
    setConsuming({
      chain: selectedOwnable.chain,
      package: selectedOwnable.packageCid,
      info,
    });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (!query) {
      // DC: convert ownables back to filtered
      computeFilters(filteredPackages);
      return;
    }

    const queryFormat = query.toLowerCase();

    const items =
      collection === StaticCollections.ALL && !isFiltering
        ? ownables
        : filteredOwnables;

    const foundedOwnables = items.filter((ownable) => {
      const pkg = PackageService.info(ownable.package);
      const lowerCasedTitle = pkg?.title?.toLowerCase() || "";
      const includesPartialKeyword = pkg && pkg.keywords ? pkg.keywords.some((keyword) => keyword.includes(queryFormat)) : false;
      const includesPartialTitle =
        lowerCasedTitle.includes(queryFormat) ||
        lowerCasedTitle.split(" ").some((part) => part.includes(queryFormat));
      return includesPartialTitle || includesPartialKeyword;
    });
    setFoundOwnables(foundedOwnables);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setFoundOwnables(filteredOwnables);
  };

  const handleSearchFilter = () => setShowFilters(!showFilters);

  const getPackageDisplayName = (str: string) => {
    if (!str) return '';
    const regex = new RegExp(/ownable/i);
    return str?.replace(regex, "").replace(/[-_]+/, " ").trim()
      .replace(/\b\w/, (c) => c.toUpperCase());
  }
  const relayImport = async (pkg: TypedPackage[] | null, triggerRefresh: boolean) => {
    try {

      sendRNPostMessage(JSON.stringify({ type: 'relay Import loop', data: "pkg" }));
      const isEmpty = pkg && pkg.every((item) => item === null || item === undefined);
      sendRNPostMessage(JSON.stringify({ type: 'isEmpty', data: isEmpty }));
      if (pkg == null || pkg.length === 0 || isEmpty) {
        enqueueSnackbar(`Nothing to Load from relay`, {
          variant: "info"
        });
        setImportingFromRelay(false);
        return;
      }
      const batchNumber = 2;

      // In a case where imported ownable is an update to an
      // existing ownable, trigger refresh to delete old version
      let triggerRefresh = false;

      // Get existing packages from local storage
      const storedPackages: TypedPackage[] =
        LocalStorageService.get("packages") || [];

      if (pkg != null && pkg.length > 0) {
        setImportLabel(`Starting Importing Ownables : (${pkg?.length || 0})`);
        activityLogService.logActivity({
          activity: `Importing Ownables from Relay : ${pkg?.length || 0}`,
          timestamp: Date.now(),
        });
        for (let i = 0; i < pkg.length; i += batchNumber) {
          setImportLabel(`Importing Ownables : (${i + 1}/${pkg.length}):${getPackageDisplayName(pkg[i]?.name || "")}`);
          activityLogService.logActivity({
            activity: `Importing Ownables from Relay : ${i + 1}/${pkg.length}`,
            timestamp: Date.now(),
          });
          activityLogService.logActivity({
            activity: `Importing Ownables from Relay : ${JSON.stringify(pkg[i])}`,
            timestamp: Date.now(),
          });
          const batch = pkg.slice(i, i + batchNumber);
          const filteredBatch = batch.filter(
            (item) => item !== null && item !== undefined
          );

          setOwnables((prevOwnables) => [
            ...prevOwnables,
            ...filteredBatch
              .filter((data: TypedPackage) => data.chain && data.cid)
              .map((data: TypedPackage) => ({
                chain: data.chain,
                package: data.cid,
                uniqueMessageHash: data.uniqueMessageHash, // Include uniqueMessageHash
              })),
          ]);

          enqueueSnackbar(`Ownable successfully loaded`, {
            variant: "success",
          });

        }
        setImportingFromRelay(false);
        LocalStorageService.remove("messageCount");
        setMessages(0);

        //Trigger a refresh only if any package matched current one
        // if (triggerRefresh) {
        //   setAlert({
        //     severity: "info",
        //     title: "New Ownables Detected",
        //     message: "New ownables have been detected. Refreshing...",
        //   });

        //   // setTimeout(() => {
        //   //   window.location.reload();
        //   // }, 4000);
        //   // LocalStorageService.set("messageCount", 0);
        //   // setMessages(0);
        // } else {
        //   enqueueSnackbar(`No matching packages found for refresh`, {
        //     variant: "info",
        //   });
        // }
      } else {
        enqueueSnackbar(`Nothing to Load from relay`, {
          variant: "error",
        });
        LocalStorageService.remove("messageCount");
        setMessages(0);
        setImportingFromRelay(false);
        setImportLabel(`Import from Relay Completed`);
      }
    } catch (error) {
      setImportingFromRelay(false);
      showError("Import failed", ownableErrorMessage(error));
      activityLogService.logActivity({
        activity: `Importing Ownables from Relay failed`,
        timestamp: Date.now(),
      });
      throw error;
    }
  };

  const importPackagesFromRelay = async () => {
    setImportingFromRelay(true);
    try {
      activityLogService.logActivity({
        activity: "Importing Ownables from Relay start api call",
        timestamp: Date.now(),
      });
      setImportLabel(`Importing From Relay, please wait...`);
      sendRNPostMessage(JSON.stringify({ type: 'import started' }));

      let pkg = await PackageService.importFromRelay();
      // filter out [null,null,null] from the response

      setImportLabel(`Import from Relay Completed , processing Ownables`);
      sendRNPostMessage(JSON.stringify({ type: 'import completed', data: pkg }));
      activityLogService.logActivity({
        activity: `Importing Ownables from Relay completed`,
        timestamp: Date.now(),
      });
      activityLogService.logActivity({
        activity: `Importing Ownables from Relay : ${JSON.stringify(pkg)}`,
        timestamp: Date.now(),
      });
      if (pkg == null) {
        setImportingFromRelay(false);
        return;
      }
      setImportLabel(`Relating Ownables : (${pkg?.length || 0})`);
      // //@ts-ignore
      // const filteredPackages = pkg.filter((p): p is TypedPackage => p !== null && p !== undefined);
      // if (filteredPackages.length === 0) {
      //   sendRNPostMessage(JSON.stringify({ type: 'import completed', data: 'No Ownables found' }));
      //   setImportingFromRelay(false);
      //   return;
      // }
      // //@ts-ignore
      // relayImport(filteredPackages);
      const [filteredPackages, triggerRefresh] = pkg as [
        Array<TypedPackage | undefined>,
        boolean
      ];

      const validPackages = Array.isArray(filteredPackages)
        ? filteredPackages.filter(
          (p): p is TypedPackage => p !== null && p !== undefined
        )
        : [];
      relayImport(validPackages, triggerRefresh);
    } catch (error) {
      setImportingFromRelay(false);
      showError("Import failed", ownableErrorMessage(error));
      activityLogService.logActivity({
        activity: `Importing Ownables from Relay failed`,
        timestamp: Date.now(),
      });
      throw error;
    }
  };

  const handleFabItemSelected = async (item: TypedFabItem) => {
    setOpenFab(false);

    switch (item.id) {
      case HomePageEnums.CreateCollection:
        setShowCollectionDrawer(true);
        return;
      case HomePageEnums.CreateOwnables:
        setShowCreateOwnableDrawer(true);
        return;
      case HomePageEnums.ImportPackage:
        setShowPackages(true);
        return;
      case HomePageEnums.ReceiveOwnables:
        importPackagesFromRelay();
        return;
      case HomePageEnums.ActivityLogs:
        setShowActivityLogDrawer(true);
        return;
      default:
        return;
    }
  };

  return (
    <>
      <div style={searchBarContainerStyle}>
        <LtoSearchBar
          query={searchQuery}
          onSearch={handleSearch}
          onFilterClick={handleSearchFilter}
          onClear={handleClearSearch}
        />
      </div>

      <div style={contentContainerStyle}>
        <If
          condition={
            searchQuery.length === 0 &&
            collection === StaticCollections.ALL &&
            !isFiltering
          }
        >
          <OwnablesTabs
            tab={selectedTab}
            ownables={ownables}
            keyExtractor={({ chain }) =>
              `${chain.id}-${reRenderTriggers[chain.id] || 0}`
            }
            renderItem={({
              chain,
              packageCid,
              canDeleteOwnable,
              collectionId,
            }) => (
              <>
                <OwnableThumb
                  chain={chain}
                  onConsume={(info) => {
                    setConsuming({ chain, package: packageCid, info });
                  }}
                  packageCid={packageCid}
                  selected={consuming?.chain.id === chain.id}
                  onOpenModal={() => openModalWithOwnable({
                    chain: chain,
                    packageCid: packageCid,
                  })}
                  onError={showError}
                  onDeleted={function (): void {
                    deleteOwnable(chain.id, packageCid);
                  }}                >
                  <If condition={consuming?.chain.id === chain.id}>
                    <LtoOverlay isForDetailsScreen={false} zIndex={1000} />
                  </If>
                  <If condition={canDeleteOwnable!}>
                    <DeleteOwnableOverlay
                      deleteFromTab
                      collectionId={collectionId}
                      chain={chain}
                    />
                  </If>
                  <If
                    condition={
                      consuming !== null && consuming.chain.id !== chain.id
                    }
                  >
                    <LtoOverlay
                      isForDetailsScreen={false}
                      zIndex={100}
                      disabled={canConsume({
                        chain,
                        package: packageCid,
                      }).then((can) => !can)}
                      onClick={() => consume(chain, consuming!.chain)}
                    />
                  </If>
                </OwnableThumb>
              </>
            )}
          />
        </If>

        {/* DC: Filter results */}
        <If condition={searchQuery.length > 0 || isFiltering}>
          <CollectionTitle />
          <If condition={foundOwnables.length === 0}>
            <EmptyCollection title={getCollectionName(collection)} />
          </If>
          <Grid container sx={gridStyle} columnSpacing={2} rowSpacing={2}>
            {foundOwnables.map(({ chain, package: packageCid }) => (
              <Grid
                key={`${chain.id}-${reRenderTriggers[chain.id] || 0}`}
                xs={6}
                sm={6}
                md={4}
                sx={{ position: "relative" }}
              >
                <OwnableThumb
                  chain={chain}
                  onConsume={(info) => {
                    setConsuming({ chain, package: packageCid, info });
                  }}
                  packageCid={packageCid}
                  selected={consuming?.chain.id === chain.id}
                  onOpenModal={() => openModalWithOwnable({
                    chain: chain,
                    packageCid: packageCid,
                  })}
                  onError={showError}
                  onDeleted={function (): void {
                    throw new Error("Function not implemented.");
                  }}                >
                  <If condition={consuming?.chain.id === chain.id}>
                    <LtoOverlay isForDetailsScreen={false} zIndex={1000} />
                  </If>
                  <If condition={isUpdatingCollection}>
                    <DeleteOwnableOverlay chain={chain} />
                  </If>
                  <If
                    condition={
                      consuming !== null && consuming.chain.id !== chain.id
                    }
                  >
                    <LtoOverlay
                      isForDetailsScreen={false}
                      zIndex={1000}
                      disabled={canConsume({
                        chain,
                        package: packageCid,
                      }).then((can) => !can)}
                      onClick={() => consume(chain, consuming!.chain)}
                    />
                  </If>
                </OwnableThumb>
              </Grid>
            ))}
          </Grid>
        </If>
      </div>
      <Box height="400px" />
      <Fab
        actions={[
          {
            id: HomePageEnums.CreateCollection,
            title: "Create Collection",
            icon: CollectionIcon,
          },
          // {
          //   id: HomePageEnums.ImportPackage,
          //   title: "Import Package",
          //   icon: CreateIcon,
          // },
          {
            id: HomePageEnums.CreateOwnables,
            title: "Create Ownables",
            icon: PlusIcon,
          },
          {
            id: HomePageEnums.ReceiveOwnables,
            title: "Receive Ownables",
            icon: message > 0 ? () =>
              <div>
                <ReceiveIcon />
                <Badge
                  badgeContent={message}
                  color="error"
                  sx={{
                    position: "absolute",
                  }}
                />
              </div>
              :
              ReceiveIcon,
          },
          {
            id: HomePageEnums.ActivityLogs,
            title: "Activity",
            icon: InfoSharp,
          },
        ]}
        open={openFab}
        onOpen={() => setOpenFab(true)}
        onClose={() => setOpenFab(false)}
        onSelect={handleFabItemSelected}
        openIcon={PlusIcon}
        closeIcon={CloseIcon}
        badgeCount={message}
      />
      {/* <PackagesFab
        open={showPackages}
        onClose={() => setShowPackages(false)}
        onSelect={forge}
        onImportFR={relayImport}
        onError={showError}
      /> */}
      {isModalOpen && selectedOwnable != null && (
        <OwnableDetailsModal
          onClose={(shouldRefresh: boolean) =>
            closeModalAndUpdate(selectedOwnable, shouldRefresh)
          }
          chain={selectedOwnable.chain}
          packageCid={selectedOwnable.packageCid}
          onDelete={() =>
            deleteOwnable(selectedOwnable.chain.id, selectedOwnable.packageCid)
          }
          onConsume={onConsumeTapped}
          onError={showError}
          uniqueMessageHash={
            PackageService.info(selectedOwnable.packageCid)?.uniqueMessageHash || ""
          }
        />
      )}
      <ConfirmDrawer
        open={consuming !== null}
        onClose={() => setConsuming(null)}
        onCancel={() => {
          setConsuming(null);
          window.location.reload();
        }}
        title="Consuming Ownable"
        isPersistent={true}
      >
        Select which Ownable should consume this{" "}
        <em>{consuming ? PackageService.info(consuming.package)?.title : ""}</em>
      </ConfirmDrawer>
      <SnackbarProvider />
      <AlertDrawer
        open={alert !== null}
        onClose={() => setAlert(null)}
        {...alert!}
      >
        {alert?.message}
      </AlertDrawer>
      <ConfirmDialog
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        {...confirm!}
      >
        {confirm?.message}
      </ConfirmDialog>
      <FiltersDrawer
        open={showFilters}
        title="Filters"
        onConfirm={() => setShowFilters(false)}
        onClose={() => setShowFilters(false)}
      />
      <CreateCollectionDrawer
        open={showCollectionDrawer}
        title="Create Collection"
        onClose={() => setShowCollectionDrawer(false)}
      />
      <CreateOwnablesDrawer
        open={showCreateOwnableDrawer}
        title="Create Ownable"
        onClose={() => setShowCreateOwnableDrawer(false)}
      />
      <ActivityLogDrawer
        open={showActivityLogDrawer}
        title="Activity Logs"
        onClose={() => setShowActivityLogDrawer(false)}
        isPersistent={true}
      />
      <Dialog
        open={importingOwnables}
        onClose={() => setImportingFromRelay(false)}
        sx={{
          "& .MuiDialog-paper": {
            backgroundColor: "#141414",
            color: "white",
            borderRadius: "10px",
            width: "100%",
          },
          "& .MuiDialogTitle-root": {
            borderBottom: "1px solid #141414",
            color: "white",
          },
          "& .MuiDialogActions-root": {
            padding: "10px",
            justifyContent: "center",
          },
          "& .MuiDialogContent-root": {
            padding: "20px",
          },
        }}
      >
        <DialogContent>
          <DialogContentText sx={{ color: "white", fontSize: "1.2rem", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <img
                src={'/logo_popup.png'}
                alt={"oBuilder Logo"}
                style={{}}
              />
              <b>Importing Ownables</b>
            </div>
            <p style={{ color: 'white', fontSize: '0.8rem', marginLeft: 10 }}>{importLabel}</p>
          </DialogContentText>
          <LinearProgress />
        </DialogContent>
      </Dialog>
      <Loading show={!loaded} />
    </>
  );
}
