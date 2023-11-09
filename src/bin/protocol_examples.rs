/**
 * Dump an example of all protocol commands to stdout.
 */
fn main() {
  let protocol_examples = renfrew_river::get_protocol_docs();
  println!("# Renfrew River Protocol Examples");
  println!("");
  println!("A list of examples of protocol commands and their responses.");
  println!("");
  for proto_ex in protocol_examples {
    println!("## {}", proto_ex.name);
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
      println!("### Command");
      println!("");
      println!("```json");
      println!("{}", cmd);
      println!("```");
    }
    for rsp in proto_ex.response_examples {
      println!("### Response");
      println!("");
      println!("```json");
      println!("{}", rsp);
      println!("```");
    }
  } 
}
