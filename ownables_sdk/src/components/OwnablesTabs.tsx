import styled from "@emotion/styled";
import { useCollections } from "../context/CollectionsContext";
import { useEffect, useState } from "react";
import { Box, Grid, IconButton, Tooltip, LinearProgress } from "@mui/material";
import CollapsedItem from "./common/CollapsedItem";
import EmptyCollection from "./common/EmptyCollection";
import {
  CollectionItemType,
  StaticCollections,
} from "../services/Collection.service";
import { EventChain } from "@ltonetwork/lto";
import React from "react";
import { useFilters } from "../context/FilterContext";
import DownloadIcon from '@mui/icons-material/Download';

const gridStyle = {
  maxWidth: 1400,
  paddingLeft: "16px",
  paddingRight: "16px",
};

interface TabProps {
  active: boolean;
}

const TabsWrapper = styled.div`
  background: rgba(20, 20, 20, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 4px;
  margin: 0 16px 16px 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const TabsContainer = styled.div`
  display: flex;
  align-items: center;
  flex-direction: row;
  gap: 8px;
`;

const Tab = styled.span<TabProps>`
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 16px;
  color: ${({ active }) => (active ? '#ffffff' : '#909092')};
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.3s ease;
  background: ${({ active }) => (active ? 'rgba(183, 112, 255, 0.15)' : 'transparent')};
  border: 1px solid ${({ active }) => (active ? 'rgba(183, 112, 255, 0.3)' : 'transparent')};
  
  &:hover {
    background: ${({ active }) => (!active ? 'rgba(255, 255, 255, 0.05)' : 'rgba(183, 112, 255, 0.15)')};
  }
`;

const DownloadSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding-right: 8px;
`;

const ProgressWrapper = styled.div`
  min-width: 200px;
  padding: 0 16px;
`;

const ProgressText = styled.div`
  color: #909092;
  font-size: 12px;
  margin-bottom: 4px;
  display: flex;
  justify-content: space-between;
`;

const StyledLinearProgress = styled(LinearProgress)`
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.1);
  
  .MuiLinearProgress-bar {
    background: linear-gradient(90deg, #B770FF 0%, #8A4BE9 100%);
  }
`;

const TabContent = styled(Box)``;

export enum TabType {
  COLLECTIONS = "COLLECTIONS",
  ALL = "ALL",
  INTERSTITIAL = "INTERSTITIAL",
}

interface OwnableType {
  chain: EventChain;
  packageCid: string;
  canDeleteOwnable?: boolean;
  collectionId?: string;
}

interface Props {
  tab: string;
  ownables: Array<{ chain: EventChain; package: string }>;
  renderItem: ({
    chain,
    packageCid,
    canDeleteOwnable,
    collectionId,
  }: OwnableType) => React.ReactNode;
  keyExtractor: (item: any, index: number) => string;
}

const OwnablesTabs = (props: Props) => {
  const [tab, selectedTab] = useState<TabType>(
    (props.tab as TabType) || TabType.ALL
  );
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [totalToDownload, setTotalToDownload] = useState(0);
  const [downloadedCount, setDownloadedCount] = useState(0);

  const [deletableFromCollections, setDeletableFromCollections] = useState<
    Array<string>
  >([]);

  const { collections, getFromCollection } = useCollections();
  const { setSelectedTab } = useFilters();

  useEffect(() => {
    handleTabChange(props.tab as TabType);
  }, [props.tab]);

  const handleTabChange = (type: TabType) => {
    selectedTab(type);
    setSelectedTab(type);
  };

  const onSetDeletableFromCollections = (
    value: boolean,
    collectionId: string
  ) =>
    setDeletableFromCollections(
      value
        ? [...deletableFromCollections, collectionId]
        : deletableFromCollections.filter((item) => item !== collectionId)
    );
  const renderCollectionItems = (
    collections: Array<CollectionItemType>,
    areStatic: boolean = false
  ) => {
    return collections.map((collection) => {
      if (collection.id === StaticCollections.ALL) return <></>;

      const collectionCids = getFromCollection(collection.id);
      const items = props.ownables.filter((item) =>
        collectionCids.includes(item.chain.id)
      );
      return (
        <CollapsedItem
          key={collection.id}
          title={collection.value}
          titleColor={areStatic ? "#B770FF" : "#ffffff"}
          collectionId={collection.id}
          isOpen={collection.isOpen}
          onEdit={(value) =>
            onSetDeletableFromCollections(value, collection.id)
          }
        >
          {items.length === 0 ? (
            <EmptyCollection title={collection.value} id={collection.id} />
          ) : (
            <Grid container columnSpacing={2} rowSpacing={2}>
              {items.map((item: any, index: number) => {
                const key = props.keyExtractor(
                  {
                    chain: item.chain,
                    packageCid: item.package,
                  },
                  index
                );
                return (
                  <Grid
                    key={key}
                    item
                    xs={6}
                    sm={6}
                    md={4}
                    sx={{ position: "relative" }}
                  >
                    {props.renderItem({
                      chain: item.chain,
                      packageCid: item.package,
                      canDeleteOwnable: deletableFromCollections.includes(
                        collection.id
                      ),
                      collectionId: collection.id,
                    })}
                  </Grid>
                );
              })}
            </Grid>
          )}
        </CollapsedItem>
      );
    });
  };

  const renderContent = () => {
    if (tab === TabType.COLLECTIONS) {
      // DC: filter static collections
      const filteredCollections = collections.filter(
        (collection) => collection.static === 0
      );
      const staticCollections = collections.filter(
        (collection) => collection.static === 1
      );

      return (
        <React.Fragment>
          {renderCollectionItems(filteredCollections, false)}
          {renderCollectionItems(staticCollections, true)}
        </React.Fragment>
      );
    } else if (tab === TabType.INTERSTITIAL) {
      //loader
      return (
        <Box p={5}>
          <>
          </>
        </Box>
      );
    }

    return (
      <>
        {props.ownables.length === 0 ? (
          <Box p={5}>
            <EmptyCollection title="All" id="all" />
          </Box>
        ) : (
          <Grid container sx={gridStyle} columnSpacing={2} rowSpacing={2}>
            {props.ownables.map((item: any, index) => (
              <Grid
                key={props.keyExtractor(
                  {
                    chain: item.chain,
                    packageCid: item.package,
                  },
                  index
                )}
                item
                xs={6}
                sm={6}
                md={4}
                sx={{ position: "relative" }}
              >
                {props.renderItem({
                  chain: item.chain,
                  packageCid: item.package,
                })}
              </Grid>
            ))}
          </Grid>
        )}
      </>
    );
  };

  return (
    <Box>
      <TabsWrapper>
        <TabsContainer>
          <Tab
            key={TabType.ALL}
            active={tab === TabType.ALL}
            onClick={() => handleTabChange(TabType.ALL)}
          >
            All
          </Tab>
          <Tab
            key={TabType.COLLECTIONS}
            active={tab === TabType.COLLECTIONS}
            onClick={() => handleTabChange(TabType.COLLECTIONS)}
          >
            Categories
          </Tab>
          <Tab
            key={TabType.INTERSTITIAL}
            active={tab === TabType.INTERSTITIAL}
            onClick={() => handleTabChange(TabType.INTERSTITIAL)}
          >
            {""}
          </Tab>
        </TabsContainer>
      </TabsWrapper>
      <TabContent>{renderContent()}</TabContent>
    </Box>
  );
};

export default OwnablesTabs;
