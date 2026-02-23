# Template Rules Reference

Templates are JSON files that define a set of rules to apply to a bibliographic record. This document describes the available rule types and how to use them.

## Template Structure

```json
{
  "template": {
    "name": "My Template",
    "rules": [
      {
        "type": "RuleType",
        "name": "Human-readable description",
        "arguments": { ... }
      }
    ]
  }
}
```

Rules are applied in order, top to bottom. A template can contain any number of rules, including multiple rules of the same type.

## Shared Concepts

**Empty values and user prompts:**
If a subfield `value` (or `replacement` in EditSubfieldRule) is set to `""`, the app will prompt the user to fill it in via a dialog before the template is applied.

**Description (optional):**
A multi-language label shown in the prompt dialog. Supported languages: `de`, `en`, `fr`, `it`.

```json
"description": { "de": "Jahr", "en": "Year", "fr": "Année", "it": "Anno" }
```

**Options (optional):**
A list of predefined values shown as a dropdown in the prompt dialog.

```json
"options": ["Dissertation", "Masterarbeit", "Bachelorarbeit"]
```

---

## ChangeControlFieldRule

Modifies a control field (e.g. 008) using regex search and replace.

| Argument | Required | Description |
|----------|----------|-------------|
| `tag` | yes | Control field tag (e.g. `"008"`) |
| `searchRegex` | yes | Regex pattern to search for |
| `replacement` | yes | Replacement string (supports capture groups `$1`, `$2`, ...) |

**Example** — Set position 24 of field 008 to `m`:

```json
{
  "type": "ChangeControlFieldRule",
  "name": "Change 008 / Pos.24 to m",
  "arguments": {
    "tag": "008",
    "searchRegex": "^(.{24}).(.*)$",
    "replacement": "$1m$2"
  }
}
```

---

## AddDataFieldRule

Adds a new complete data field (with indicators and subfields) to the record. If the exact same field already exists, it is not added again.

| Argument | Required | Description |
|----------|----------|-------------|
| `tag` | yes | Field tag (e.g. `"655"`) |
| `ind1` | yes | First indicator (single character or `""` for blank) |
| `ind2` | yes | Second indicator (single character or `""` for blank) |
| `subfields` | yes | Array of subfields to add (see below) |

Each subfield has:

| Property | Required | Description |
|----------|----------|-------------|
| `code` | yes | Subfield code (e.g. `"a"`) |
| `value` | yes | Subfield value (`""` triggers user prompt) |
| `description` | no | Multi-language label for the prompt dialog |
| `options` | no | Dropdown choices for the prompt dialog |

**Example** — Add a 655 genre field:

```json
{
  "type": "AddDataFieldRule",
  "name": "Add 655_7 Hochschulschrift",
  "arguments": {
    "tag": "655",
    "ind1": "",
    "ind2": "7",
    "subfields": [
      { "code": "a", "value": "Hochschulschrift" },
      { "code": "2", "value": "gnd-content" }
    ]
  }
}
```

---

## AddSubfieldRule

Adds a new subfield to an existing data field. The target field is identified by tag and optional indicators. Conditions can be used to control when the subfield is added.

| Argument | Required | Description |
|----------|----------|-------------|
| `targetField` | yes | Which field to add the subfield to (see below) |
| `conditions` | no | Array of conditions that must all be met (see [Conditions](#conditions)) |
| `subfield` | yes | The subfield to add: `code`, `value`, and optional `description`/`options` |

**targetField:**

| Property | Required | Description |
|----------|----------|-------------|
| `tag` | yes | Field tag (e.g. `"040"`) |
| `ind1` | no | First indicator to match (see [Indicator Matching](#indicator-matching)) |
| `ind2` | no | Second indicator to match (see [Indicator Matching](#indicator-matching)) |

**Example** — Add $$d to field 040, only if no existing $$d already contains "CH-ZuSLS":

```json
{
  "type": "AddSubfieldRule",
  "name": "Add $$d CH-ZuSLS UNIGE",
  "arguments": {
    "targetField": { "tag": "040" },
    "conditions": [
      { "code": "a", "valueRegex": "CH-ZuSLS", "negate": true },
      { "code": "d", "valueRegex": "CH-ZuSLS", "negate": true }
    ],
    "subfield": { "code": "d", "value": "CH-ZuSLS UNIGE" }
  }
}
```

**Example** — Add $$4 with a user-prompted value:

```json
{
  "type": "AddSubfieldRule",
  "name": "Add $$4 (prompted)",
  "arguments": {
    "targetField": { "tag": "700", "ind1": "1" },
    "subfield": {
      "code": "4",
      "value": "",
      "description": { "de": "Funktionscode", "en": "Relator code", "fr": "Code de fonction", "it": "Codice di funzione" }
    }
  }
}
```

---

## EditSubfieldRule

Changes the value of an existing subfield. If no matching subfield is found, nothing happens.

| Argument | Required | Description |
|----------|----------|-------------|
| `targetField` | yes | Which field contains the subfield (same as AddSubfieldRule) |
| `conditions` | no | Array of conditions that must all be met (see [Conditions](#conditions)) |
| `targetSubfield` | yes | Which subfield to edit (see below) |
| `replacement` | yes | New value (`""` triggers user prompt). Supports capture groups if `searchRegex` is set. |
| `searchRegex` | no | If set, uses pattern-based replacement instead of replacing the whole value |

**targetSubfield:**

| Property | Required | Description |
|----------|----------|-------------|
| `code` | yes | Subfield code to edit (e.g. `"b"`) |
| `valueRegex` | no | Only edit subfields whose current value matches this regex |

**Example** — Change $$b to "fre" if it is not already fre, ger, or ita:

```json
{
  "type": "EditSubfieldRule",
  "name": "Set $$b to fre",
  "arguments": {
    "targetField": { "tag": "040" },
    "targetSubfield": { "code": "b", "valueRegex": "^(?!ger$|fre$|ita$)" },
    "replacement": "fre"
  }
}
```

**Example** — Pattern-based replacement using searchRegex:

```json
{
  "type": "EditSubfieldRule",
  "name": "Replace old code in $$a",
  "arguments": {
    "targetField": { "tag": "040" },
    "targetSubfield": { "code": "a" },
    "searchRegex": "OLD_CODE",
    "replacement": "NEW_CODE"
  }
}
```

---

## Indicator Matching

For `AddSubfieldRule` and `EditSubfieldRule`, the `ind1` and `ind2` properties in `targetField` control which fields are matched:

| Value in JSON | Matches |
|---------------|---------|
| not specified | **Any** indicator value (wildcard) |
| `" "` (space) | Only fields with a blank indicator |
| `"1"`, `"0"`, etc. | Only fields with that exact indicator value |

**Examples:**

```json
{ "tag": "700" }                          // matches all 700 fields, any indicators
{ "tag": "700", "ind1": "1" }             // matches 700 fields with ind1=1
{ "tag": "655", "ind1": " ", "ind2": "7"} // matches 655 fields with blank ind1 and ind2=7
```

> **Note:** `AddDataFieldRule` uses `ind1`/`ind2` differently — there, `""` means "blank indicator" because it defines a new field to create, not a field to find.

---

## Conditions

`AddSubfieldRule` and `EditSubfieldRule` support an optional `conditions` array. All conditions must be met for the rule to apply (AND logic). Each condition checks an existing subfield in the target field.

| Property | Required | Description |
|----------|----------|-------------|
| `code` | yes | Subfield code to check (e.g. `"d"`) |
| `exists` | no | `true`: subfield must exist. `false`: subfield must not exist. |
| `valueRegex` | no | Regex to match against the subfield value |
| `negate` | no | If `true`, the `valueRegex` condition is inverted (subfield must NOT match) |

> `exists` and `valueRegex` cannot be used together in the same condition.

**Examples:**

| Condition | Meaning |
|-----------|---------|
| `{ "code": "b", "exists": true }` | Field must have a $$b |
| `{ "code": "b", "exists": false }` | Field must not have a $$b |
| `{ "code": "d", "valueRegex": "CH-ZuSLS" }` | At least one $$d must contain "CH-ZuSLS" |
| `{ "code": "d", "valueRegex": "CH-ZuSLS", "negate": true }` | No $$d may contain "CH-ZuSLS" |

---

## Combining Rules

Multiple rules can be combined in a single template to achieve complex transformations. For example, to "upsert" a subfield (edit if it exists, add if it doesn't), use an EditSubfieldRule and an AddSubfieldRule together:

```json
{
  "template": {
    "name": "Upsert $$b fre in 040",
    "rules": [
      {
        "type": "EditSubfieldRule",
        "name": "Set $$b to fre (if exists and not fre/ger/ita)",
        "arguments": {
          "targetField": { "tag": "040" },
          "targetSubfield": { "code": "b", "valueRegex": "^(?!ger$|fre$|ita$)" },
          "replacement": "fre"
        }
      },
      {
        "type": "AddSubfieldRule",
        "name": "Add $$b fre (if missing)",
        "arguments": {
          "targetField": { "tag": "040" },
          "conditions": [{ "code": "b", "exists": false }],
          "subfield": { "code": "b", "value": "fre" }
        }
      }
    ]
  }
}
```
