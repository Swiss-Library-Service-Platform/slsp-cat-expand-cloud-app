# SLSP CatExpand

This application is available as a Alma Cloud App. <br>
It can be installed in your Alma instance. <br>
For more information on Cloud Apps, see the [Online Help](https://knowledge.exlibrisgroup.com/Alma/Product_Documentation/010Alma_Online_Help_(English)/050Administration/050Configuring_General_Alma_Functions/Configuring_Cloud_Apps). 

## Features
Expand records data fields based on specified templates. 

- Loading bib records from entities in MDE ✓
- Define templates with rules ✓
    - Personal templates ✓
    - Institution Zone templates ✓
- Apply templates to bib records in NZ ✓

## Requirements
In order to use this Alma Cloud App, the institution of the user must be 
- a member of the SLSP network zone 
- manually unlocked by SLSP to use this service. 

Additionally, the current Alma user has to contain the following user role: 
- Cataloger 

To define templates that are available for the whole Institution Zone, the user has to contain the following user role:
- Cataloger Extended

# Developer Notes

### How to create templates

1. Add template definition json file in assets/templates
2. Register the template definition file in assets/templates/_template-index.json

#### Rules and how to instantiate templates

- Rules need a RuleCreator impl.
- Rules need a RulesArg definition
- RuleCreators must be registered in app.module.ts (for injection)

## Dev: Common issues

### MacOS Error: OpenSSL Error 'ERR_OSSL_EVP_UNSUPPORTED'

Run in Terminal: `export NODE_OPTIONS=--openssl-legacy-provider`
and then run `eca start` again.