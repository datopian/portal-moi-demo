import ListOfGroups from "../../components/groups/ListOfGroups";
import Layout from "../../components/_shared/Layout";
import { useState } from "react";
import SearchHero from "../../components/dataset/_shared/SearchHero";
import { Group } from "@portaljs/ckan";
import { getAllGroups } from "@/lib/queries/groups";
import MiniSearch from "minisearch";

export async function getServerSideProps() {
  const groups = await getAllGroups();
  return {
    props: {
      groups,
    },
  };
}

export default function TopicsPage({ groups }): JSX.Element {
  const miniSearch = new MiniSearch({
    fields: ["description", "display_name"],
    storeFields: ["description", "display_name", "image_display_url", "name"],
  });
  miniSearch.addAll(groups);

  return <Main miniSearch={miniSearch} groups={groups} />;
}

function Main({
  miniSearch,
  groups,
}: {
  miniSearch: MiniSearch<any>;
  groups: Array<Group>;
}) {
  const [searchString, setSearchString] = useState("");
  return (
    <Layout>
      <SearchHero
        title="Topics"
        searchValue={searchString}
        onChange={setSearchString}
      />
      <main className="custom-container py-8">
        <ListOfGroups
          groups={groups}
          searchString={searchString}
          miniSearch={miniSearch}
        />
      </main>
    </Layout>
  );
}
