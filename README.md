# Erudit Knowledge Map

The Érudit Knowledge Map aims at mapping the knowledge transfer that occurs in the Érudit corpus, such as co-authorship networks in specific journals, or by institution, date, author or paper title.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

Please ensure that you have [NPM](https://www.npmjs.com/), [NodeJS](https://nodejs.org/en/) and [GulpJS](https://gulpjs.com/) (optional) must be installed on your computer in order to run this application.

### Installing

Packages are bundled in `package.json`.

`npm install`

### Running the Node JS Server

After successfully installing you should be able to run the NodeJS server with the following command:

```
npm start
```

### Debugging

Several GulpJS functions have been pre-made in order to optimize the workflow. 

Here is a list of available tasks:

* `gulp vendor` - Copy third-party libraries from node_modules to client folder
* `gulp js` - Concatenate and minify javascript files
* `gulp css` - Compile SASS, concatenate and minify CSS
* `gulp dev` - Run `js`, `css` task and sync files to browser to automatically detect saved changes
* `gulp` - Run `vendor`, `js`, and `css` tasks

## Deployment

Deployment is made simple due to the use of Docker. Run the shell script using the command provided below, and ensure that the appropriate routing/proxies have been setup on your web server. 

NOTE: Modifications of used ports may be required.

```
./run.sh
```

## Built With

* [NPM](https://www.npmjs.com/) - Package Manager
* [NodeJS](https://nodejs.org/en/) - The web framework / packaging system used
* [SASS](https://gulpjs.com/) - CSS Extension
* [GulpJS](https://gulpjs.com/) - Workflow automation tool
* [Bootstrap](https://getbootstrap.com/) - Front-end component library
* [D3](https://d3js.org/) - Visualization Library
* [Docker](https://www.docker.com/) - Container / Dependency management

## Versioning

This project is being developed using an iterative approach. Therefore, now releases have yet been made and the project will be subject to drastic changes. No versioning practices will be followed until release. To see a history of changes made to this project, see [commit history](https://github.com/vialab/Erudit-Maps/commits/).

## Authors

* Adam Bradley, PhD. - Research Associate
* Christopher Collins, PhD. - Research Supervisor
* Victor (Jay) Sawal, BSc. - Software Developer

## License

This research was conducted as part of the CO.SHS project (co-shs.ca) and has received financial support from the Canada Foundation for Innovation (Cyberinfrastructure Initiative – Challenge 1 – First competition).

## Acknowledgments

* Richard Drake, MSc. - Laboratory Technician (Science Building)
