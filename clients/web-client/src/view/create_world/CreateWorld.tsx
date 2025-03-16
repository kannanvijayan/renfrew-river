import CreateWorldViewState from "../../state/view/create_world/create_world";
import WorldViz from "./WorldViz";
import SpecifyNewWorld from "./SpecifyNewWorld";

export default function CreateWorld(props: {
  viewState: CreateWorldViewState,
}) {
  const { viewState } = props;

  if ("SpecifyDescriptor" in viewState) {
    return (<SpecifyNewWorld viewState={viewState.SpecifyDescriptor} />);
  } else if ("GeneratingWorld" in viewState) {
    return (<WorldViz viewState={viewState.GeneratingWorld} />);
  } else {
    console.error("CreateWorld: invalid viewState", viewState);
    return <></>;
  }
}
