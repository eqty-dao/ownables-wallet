import styled from "@emotion/styled";
import { useCollections } from "../context/CollectionsContext";
import { useEffect, useState } from "react";
import { Box, Grid } from "@mui/material";
import CollapsedItem from "./common/CollapsedItem";
import EmptyCollection from "./common/EmptyCollection";
import {
  CollectionItemType,
  StaticCollections,
} from "../services/Collection.service";
import { EventChain } from "@ltonetwork/lto";
import React from "react";
import { useFilters } from "../context/FilterContext";

const gridStyle = {
  maxWidth: 1400,
  paddingLeft: "16px",
  paddingRight: "16px",
};

interface TabProps {
  active: boolean;
}

const Tab = styled.span<TabProps>`
  display: block;
  cursor: pointer;
  font-size: 20px;
  color: #909092;
  padding: 12px;
  outline: none;
  appearance: none;

  ${({ active }) =>
    active &&
    `
        color: #ffffff;
    `}
`;

const TabsContainer = styled.div`
  display: flex;
  align-items: center;
  flex-direction: row;
`;

const TabContent = styled(Box)``;

export enum TabType {
  COLLECTIONS = "COLLECTIONS",
  ALL = "ALL",
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
    (props.tab as TabType) || TabType.COLLECTIONS
  );

  const [deletableFromCollections, setDeletableFromCollections] = useState<
    Array<string>
  >([]);

  const { collections, getFromCollection } = useCollections();
  const { setSelectedTab } = useFilters();

  useEffect(() => {
    handleTabChange(props.tab as TabType);
    // eslint-disable-next-line
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
            <EmptyCollection title={collection.value} />
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
    }

    return (
      <>
        {props.ownables.length === 0 ? (
          <Box p={5}>
            <EmptyCollection title="All" />
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
      <TabsContainer>
        <Tab
          key={TabType.COLLECTIONS}
          active={tab === TabType.COLLECTIONS}
          onClick={() => handleTabChange(TabType.COLLECTIONS)}
        >
          Collections
        </Tab>
        <Tab
          key={TabType.ALL}
          active={tab === TabType.ALL}
          onClick={() => handleTabChange(TabType.ALL)}
        >
          All
        </Tab>
      </TabsContainer>
      <TabContent>{renderContent()}</TabContent>
    </Box>
  );
};

export default OwnablesTabs;
