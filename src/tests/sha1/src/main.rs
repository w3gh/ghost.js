extern crate sha1;

use std::{env};
use sha1::{Sha1, Digest};
use std::path::Path;
use std::fs::File;
use std::io::Read;

fn main() {
    let args: Vec<String> = env::args().collect();

    if args.len() > 1 {
        let mut hasher = Sha1::new();
        let file_name = &args[1];
        let path = Path::new(&file_name);

        if !path.exists() {
            panic!("Not Found!")
        }

        let mut map_data = Vec::new();
        let mut file = File::open(&file_name).expect("Unable to open file");

        file.read_to_end(&mut map_data).expect("Unable to read");

        if !map_data.is_empty() {
            hasher.input(map_data);

            let result = hasher.result();

            println!("{}", result.iter().map(|x| x.to_string() + " ").collect::<String>())

        }
    }
}
