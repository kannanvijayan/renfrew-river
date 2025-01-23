/**
 * Dump an example of all protocol commands to stdout.
 */
fn main() {
  let protocol_examples = renfrew_river::get_protocol_docs();
  println!("# {}", span_color(LIGHT_BLUE, "Renfrew River Protocol Examples"));
  println!("");
  println!("A list of examples of protocol commands and their responses.");
  println!("");
  for proto_ex in protocol_examples {
    println!("## {}", span_color(ORANGE, &proto_ex.name));
    println!("");
    println!("{}", proto_ex.description);
    println!("");
    if proto_ex.notes.len() > 0 {
      for note in proto_ex.notes {
        println!("  * {}", note);
      }
      println!("");
    }
    for cmd in proto_ex.command_examples {
      println!("### {}", span_color(PALE_YELLOW, "Command"));
      println!("");
      println!("```json");
      println!("{}", cmd);
      println!("```");
    }
    for rsp in proto_ex.response_examples {
      println!("### {}", span_color(PALE_YELLOW, "Response"));
      println!("");
      println!("```json");
      println!("{}", rsp);
      println!("```");
    }
  } 
}

const PALE_YELLOW: &'static str = "#dddd88";
const ORANGE: &'static str = "#ffaa66";

// light blue
const LIGHT_BLUE: &'static str = "#66ccff";

fn span_color(color: &str, inner: &str) -> String {
  format!("<span style=\"color: {};\">{}</span>", color, inner)
}
