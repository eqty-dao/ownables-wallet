/* eslint-disable @typescript-eslint/no-unused-vars */

import * as React from "react";
import { TypedPackage, TypedPackageStub } from "../interfaces/TypedPackage";
import selectFile from "../utils/selectFile";
import PackageService from "../services/Package.service";
import { useEffect } from "react";
import Loading from "./Loading";
import useBusy from "../utils/useBusy";
import PackagesDrawer from "./DetailsModal/PackagesDrawer";
import { sendRNPostMessage } from "../utils/postMessage";

interface PackagesFabProps {
  open: boolean;
  onClose: () => void;
  onSelect: (pkg: TypedPackage) => void;
  onError: (title: string, message: string) => void;
  onImportFR: (pkg: any) => void;
}

export default function PackagesFab(props: PackagesFabProps) {
  const { open, onClose, onSelect, onError, onImportFR } = props;
  const [packages, setPackages] = React.useState<
    Array<TypedPackage | TypedPackageStub>
  >([]);
  const [isBusy, busy] = useBusy();

  const updatePackages = () => setPackages(PackageService.list());
  useEffect(updatePackages, []);

  const importPackages = async () => {
    // DC: Let react native know that we are opening a file dialog
    sendRNPostMessage(
      JSON.stringify({ type: "openFileDialog", data: { forceSignout: false } })
    );

    // DC: After 100ms, let react native know that we are closing the file dialog
    // File dialog does not return anything when cancel button is pressed
    setTimeout(() => {
      sendRNPostMessage(
        JSON.stringify({ type: "openFileDialog", data: { forceSignout: true } })
      );
    }, 100);

    const files = await selectFile({ accept: ".zip", multiple: true });
    if (files.length === 0) return;

    try {
      await busy(
        Promise.all(
          Array.from(files).map((file) => PackageService.import(file))
        )
      );
      updatePackages();
    } catch (error) {
      onError(
        "Failed to import package",
        (error as Error).message || (error as string)
      );
    }
  };

  const importPackagesFromRelay = async () => {
    try {
      const pkg = await PackageService.importFromRelay();
      console.log(pkg);
      onImportFR(pkg);
      //updatePackages();
    } catch (error) {
      onError(
        "Failed to import package",
        (error as Error).message || (error as string)
      );
    }
  };

  const selectPackage = async (pkg: TypedPackage | TypedPackageStub) => {
    if ("stub" in pkg) {
      try {
        pkg = await busy(PackageService.downloadExample(pkg.name));
        updatePackages();
      } catch (error) {
        onError(
          "Failed to import package",
          (error as Error).message || (error as string)
        );
        return;
      }
    }

    onSelect(pkg);
  };

  return (
    <>
      <PackagesDrawer
        packages={packages}
        open={open}
        onClose={onClose}
        onSelect={selectPackage}
        onImport={importPackages}
        //fetchPkgFromRelay={importPackagesFromRelay}
      />
      <Loading show={isBusy} />
    </>
  );
}
