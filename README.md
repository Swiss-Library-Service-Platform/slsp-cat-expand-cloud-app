# Alma Record Expander (Proof of Concept)

An [ExLibris Alma CloudApp](https://developers.exlibrisgroup.com/cloudapps/), which allows to apply templates to bibliographic records.
<br>
<br>
## Proof of Concept
- Loading bib records from entities in MDE ✓
- Defining and appling templates with rules ✓
- Updating NZ bib records from CloudApps ✖️

➡ https://developers.exlibrisgroup.com/forums/topic/update-bib-record-in-nz-via-api/

# Development notes

## How to create templates

1. Add template definition json file in assets/templates
2. Register the template definition file in assets/templastes/_template-index.json

### Rules and how to instantiate templates

- Rules need a RuleCreator impl.
- Rules need a RulesArg definition
- RuleCreators must be registered in app.module.ts (for injection)

## Dev: Common issues

### MacOS Error: OpenSSL Error 'ERR_OSSL_EVP_UNSUPPORTED'

Run in Terminal: `export NODE_OPTIONS=--openssl-legacy-provider`
and then run `npm start` again.