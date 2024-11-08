// import { BaseBlockstore } from "blockstore-core/base";
// import { importer } from "ipfs-unixfs-importer";
// import { sendRNPostMessage } from "./postMessage";

// class DummyBlockstore extends BaseBlockstore {
//   // @ts-ignore  // TODO:JS line below was ignored to allow successful compile
//   async put() { }
//   async has() { return false; }
// }

// export default async function calculateCid(files: File[]): Promise<string> {
//   try {
//     const source = await Promise.all(
//       files.map(async file => ({
//         path: `./${file.name}`,
//         content: new Uint8Array(await file.arrayBuffer()),
//       }))
//     );

//     const blockstore = new DummyBlockstore();
//     console.log('entering importer', source, blockstore);
//     // @ts-ignore  // TODO:JS line below was ignored to allow successful compile
//     for await (const entry of importer(source, blockstore)) {
//       if (entry.path === '' && entry.unixfs?.type === 'directory') return entry.cid.toString();
//     }
//   } catch (error) {
//     console.error(error);
//     sendRNPostMessage(JSON.stringify({ type: 'sdkerror', data: error }));
//     return '';

//   }
//   return '';
// }
import { BaseBlockstore } from "blockstore-core/base";
import { error } from "console";
import { importer } from "ipfs-unixfs-importer";

class DummyBlockstore extends BaseBlockstore {
  //@ts-ignore
  async put() { }
  async has() {
    return false;
  }
}

export default async function calculateCid(files: File[]): Promise<string> {
  const source = await Promise.all(
    files.map(async (file) => ({
      path: `./package/${file.name}`,
      content: new Uint8Array(await file.arrayBuffer()),
    }))
  );

  const blockstore = new DummyBlockstore();
  //@ts-ignore
  for await (const entry of importer(source, blockstore)) {
    if (entry.path === "package" && entry.unixfs?.type === "directory")
      return entry.cid.toString();
  }

  throw new Error(
    "Failed to calculate directory CID: importer did not find a directory entry in the input files"
  );
}
