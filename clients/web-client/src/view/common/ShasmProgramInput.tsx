export default function ShasmProgramInput(props: {
  programText: string,
  onChange: (newText: string) => void,
}) {
  const { programText, onChange } = props;
  return (
    <textarea spellCheck="false"
        onChange={e => onChange(e.target.value)}
        value={programText}
        style={{
          backgroundColor: "#cb8",
          color: "#411",
          borderRadius: "0.5rem",
          fontSize: "1.5rem",
          padding: "0.5rem",
          margin: "0 1rem 0 0",
          width: "40%",
          height: "20rem",
          flex: 1,
        }} />
  );
}
