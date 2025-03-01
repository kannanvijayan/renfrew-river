import CreateWorldViewState from "../../state/view/create_world/create_world";
import SpecifyNewWorld from "./SpecifyNewWorld";

export default function CreateWorld(props: {
  viewState: CreateWorldViewState,
}) {
  const { viewState } = props;
  console.log("CreateWorld: viewState", viewState);

  if ("SpecifyDescriptor" in viewState) {
    console.log("CreateWorld: SpecifyDescriptor");
    return (<SpecifyNewWorld viewState={viewState.SpecifyDescriptor} />);
  } else {
    console.error("CreateWorld: invalid viewState", viewState);
    return <></>;
  }
}
