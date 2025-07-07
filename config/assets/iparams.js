function notify(message, type = "success") {
    console.log('donzzz2')
    var bgColor = type == "success" ? "#02b875" : "#DC161F";

    Toastify({
        text: message,
        duration: 2000,
        newWindow: true,
        close: true,
        gravity: "top",
        position: "right",
        offset: {
            x: 70,
            y: 20,
        },
        stopOnFocus: true,
        style: {
            background: bgColor,
        },
    }).showToast();
}


function switchTab(tabIndex) {
    const tabsContainer = $(elements.tabs)[0];
    if (tabsContainer) {
        tabsContainer.setAttribute("active-tab-index", tabIndex);
    }
}

function toggleBtnLoader(buttonSelector, isLoading, originalText = "Validate &#10095;") {
    if (isLoading) {
        $(buttonSelector).html("<fw-spinner size='small' color='#fff'></fw-spinner>");
    } else {
        $(buttonSelector).html(originalText);
    }
}


async function fetchModules(domain, api) {
    try {
        console.log("Fetch Module called");

        const response = await client.request.invokeTemplate("fetch_module", {
            context: {
                host: domain,
                api: api,
            },
        });
        return response;
    } catch (error) {
        console.error("❌ Error fetching modules:", error);
        throw error;
    }
}


function resetFsValidation() {
    ls.isFsValid = false;
    $(elements.validateFsBtn).attr("disabled", false);
    $(elements.validateFsBtn).html("Validate &#10095;");
}
function switchTab(tabIndex) {
    console.log('🔁 Switching to tab:', tabIndex);

    const tabsContainer = document.querySelector("#tabs");
    if (tabsContainer) {
        // Enable tab if needed
        const tabElements = tabsContainer.querySelectorAll("fw-tab");
        if (tabElements[tabIndex]?.hasAttribute("disabled")) {
            tabElements[tabIndex].removeAttribute("disabled");
        }

        tabsContainer.activeTabIndex = tabIndex; // ✅ Works for fw-tabs
    }
}


function addConditionBlock() {
    if (!isAuthenticated) {
        switchTab(0);
        return;
    }

    const container = $(elements.conditionContainer);
    const index = container.children().length;
    const block = $(`
      <div class="condition-block">
        <div class="block-header">
          <div class="block-title">Condition ${index + 1}</div>
          <button class="remove-btn" onclick="removeConditionBlock(this)">✕</button>
        </div>
        <div class="field-row">
          <fw-select label="Module" class="conditionModuleSelect" id="condMod${index}">
            <fw-select-option value="">Select Module</fw-select-option>
            ${modules.map(m => `<fw-select-option value="${m}">${m.charAt(0).toUpperCase() + m.slice(1)}</fw-select-option>`).join("")}
          </fw-select>
          <fw-select label="Field" class="conditionModuleSelect" id="condField${index}">
            <fw-select-option value="">Select Field</fw-select-option>
          </fw-select>
          <fw-select label="Value" class="conditionModuleSelect" id="condValue${index}">
            <fw-select-option value="">Select Value</fw-select-option>
          </fw-select>
        </div>
        <div class="validation-error-message" id="condError${index}"></div>
      </div>
    `);

    container.append(block);

    // Add event listeners
    $(`#condMod${index}`).on("fwChange", (e) => {
        resetConditionValidation()
        const idx = e.target.id.replace("condMod", "");
        loadFields(`condMod${idx}`, `condField${idx}`, `condValue${idx}`, parseInt(idx));
    });

    $(`#condField${index}`).on("fwChange", (e) => {
        resetConditionValidation()
        const idx = e.target.id.replace("condField", "");
        loadFieldValues(`condMod${idx}`, `condField${idx}`, `condValue${idx}`);
    });
    $(`#condValue${index}`).on("fwChange", () => {
        resetConditionValidation()
    });

}

// Updated loadFields function with GLOBAL field filtering
async function loadFields(
    modId,
    fieldId,
    valueId,
    blockIndex = null,
    preserveSelectedField = null
) {
    console.log("load fields called for block index:", blockIndex);

    const modElem = document.getElementById(modId);
    const fieldElem = document.getElementById(fieldId);
    const valueElem = document.getElementById(valueId);

    const selectedModule = modElem?.value;

    fieldElem.innerHTML =
        '<fw-select-option value="">Select Field</fw-select-option>';
    valueElem.innerHTML =
        '<fw-select-option value="">Select Value</fw-select-option>';

    if (!selectedModule) {
        return;
    }

    fieldElem.innerHTML =
        '<fw-select-option value="">Loading fields...</fw-select-option>';

    try {
        // Get ALL currently selected fields across ALL condition blocks
        const allSelectedFields = getAllSelectedFields(blockIndex);

        console.log("Globally selected fields to exclude:", allSelectedFields);
        console.log("Preserved field (if any):", preserveSelectedField);

        // Fetch fields for the selected module (no exclusion at API level)
        const fields = await fetchFieldsFromAPI(selectedModule, []);

        if (!fields) {
            fieldElem.innerHTML =
                '<fw-select-option value="">Error loading fields</fw-select-option>';
            return;
        }

        fieldElem.innerHTML =
            '<fw-select-option value="">Select Field</fw-select-option>';

        let array = [];
        fieldObject[`${selectedModule}`] = fields.fields;

        fields.fields.forEach((field) => {
            if (
                field.label &&
                field.name &&
                field.type != "text" &&
                field.type != "number" &&
                field.type != "textarea"
            ) {
                // Check if field is available (not selected in other conditions)
                const isPreservedField = preserveSelectedField === field.name;
                const isFieldAlreadySelected = allSelectedFields.includes(field.name);

                // Include field if:
                // 1. It's the preserved field (currently selected in this block), OR
                // 2. It's not selected anywhere else
                if (isPreservedField || !isFieldAlreadySelected) {
                    array.push({ text: field.label, value: field.name });
                } else {
                    console.log(`Excluding field "${field.label}" (${field.name}) - already selected elsewhere`);
                }
            }
        });

        console.log(`Available fields for block ${blockIndex}:`, array.map(f => f.text));

        fieldElem.options = array;

        // Restore previously selected field if preserving
        if (preserveSelectedField && array.some(option => option.value === preserveSelectedField)) {
            fieldElem.value = preserveSelectedField;
        }

    } catch (error) {
        console.error("Error loading fields:", error);
        fieldElem.innerHTML =
            '<fw-select-option value="">Error loading fields</fw-select-option>';
    }
}

// Function to get all currently selected fields from ALL conditional triggers
function getAllSelectedFields(excludeIndex = null) {
    const selectedFields = [];
    const condBlocks = document.querySelectorAll(
        "#conditionContainer .condition-block"
    );

    condBlocks.forEach((block, index) => {
        // Skip the current block being populated
        if (excludeIndex !== null && index === excludeIndex) {
            return;
        }

        const fieldSelect = document.getElementById(`condField${index}`);

        if (fieldSelect && fieldSelect.value) {
            selectedFields.push(fieldSelect.value);
        }
    });

    return selectedFields;
}


// Modified function to fetch fields from Freshsales API with filtering
async function fetchFieldsFromAPI(module, excludeFields = []) {
    if (!freshsalesDomain || !apiKey) {
        console.error("Not authenticated or missing credentials");
        return null;
    }

    try {
        console.log("url and module :", freshsalesDomain, module);
        let response;

        // === ✅ Handle CUSTOM MODULE (e.g., cm_offline_sampark)
        if (moduleMap[module].startsWith("cm_")) {
            response = await client.request.invokeTemplate(
                "GetFreshsalesCustomFields",
                {
                    context: {
                        host: freshsalesDomain,
                        api: apiKey,
                        module: moduleMap[module],
                    },
                }
            );

            if (response.status === 200 && response.response) {
                const parsed = JSON.parse(response.response);
                fieldsMetadata[module] = parsed;

                const forms = parsed.forms || [];
                const filteredData = {
                    fields: [],
                };

                // Helper: recursively extract leaf fields only (skip section containers)
                function extractLeafFields(fields) {
                    let results = [];
                    for (const field of fields) {
                        if (field.type === "section" && Array.isArray(field.fields)) {
                            results.push(...extractLeafFields(field.fields));
                        } else {
                            results.push(field);
                        }
                    }
                    return results;
                }

                forms.forEach((form) => {
                    if (Array.isArray(form.fields)) {
                        const flatFields = extractLeafFields(form.fields);
                        filteredData.fields.push(...flatFields);
                    }
                });

                return filteredData;
            } else {
                console.error("Failed to fetch fields:", response);
                return null;
            }
        } else {
            // === ✅ Handle STANDARD MODULE
            response = await client.request.invokeTemplate(
                "GetFreshsalesFields",
                {
                    context: {
                        host: freshsalesDomain,
                        api: apiKey,
                        module: moduleMap[module],
                    },
                }
            );

            if (response.status === 200 && response.response) {
                const parsed = JSON.parse(response.response);
                fieldsMetadata[module] = parsed;

                const allFields = parsed.fields || [];

                const filteredData = {
                    fields:
                        excludeFields.length > 0
                            ? allFields.filter((f) => !excludeFields.includes(f.name))
                            : allFields,
                };

                return filteredData;
            } else {
                console.error("Failed to fetch standard fields:", response);
                return null;
            }
        }
    } catch (error) {
        console.error("Error fetching fields:", error);
        return null;
    }
}



async function loadFieldValues(modId, fieldId, valueId) {
    const modElem = document.getElementById(modId);
    const fieldElem = document.getElementById(fieldId);
    const valueElem = document.getElementById(valueId);

    const selectedModule = modElem?.value;
    const selectedField = fieldElem?.value;

    if (!selectedModule || !selectedField) return;

    // Only add to selected_field array if not populating
    if (!isPopulating) {
        selected_field.push(selectedField);
        const uniqueArray = [...new Set(selected_field)];
    }

    valueElem.innerHTML = '<fw-select-option value="">Loading values...</fw-select-option>';

    try {
        // Step 1: Attempt to find field from flat structure
        let field = fieldsMetadata[selectedModule]?.fields?.find((f) => f.name === selectedField);

        // Step 2: Recursively search inside forms if not found (custom module support)
        if (!field && Array.isArray(fieldsMetadata[selectedModule]?.forms)) {
            const forms = fieldsMetadata[selectedModule].forms;

            function deepFindField(fields, targetName) {
                for (const f of fields) {
                    if (f.name === targetName) return f;
                    if (Array.isArray(f.fields)) {
                        const found = deepFindField(f.fields, targetName);
                        if (found) return found;
                    }
                }
                return null;
            }

            for (const form of forms) {
                if (form.fields) {
                    field = deepFindField(form.fields, selectedField);
                    if (field) break;
                }
            }
        }

        // Step 3: Show choices in dropdown
        valueElem.innerHTML = '<fw-select-option value="">Select Value</fw-select-option>';

        if (field && Array.isArray(field.choices)) {
            let valueArray = [];

            if (["radio_button", "checkbox"].includes(field.type)) {
                valueArray = [
                    { text: "Yes", value: "true" },
                    { text: "No", value: "false" }
                ];
            } else if (field.type === "date") {
                valueArray = [{ text: "Not Empty", value: "not_empty" }];
            } else {
                valueArray = field.choices.map((choice) => ({
                    text: choice.value || choice.text || choice,
                    value: choice.value || choice.text || choice
                }));
            }

            // Assign the options
            valueElem.options = valueArray;
            return;
        }

        // Step 4: Fallback message if no choices are found
        valueElem.innerHTML =
            '<fw-select-option value="">No choices available</fw-select-option>';
    } catch (error) {
        console.error("Error loading field values:", error);
        valueElem.innerHTML =
            '<fw-select-option value="">Error loading values</fw-select-option>';
    }
}


function saveConditionBlock() {
    toggleBtnLoader(elements.validateConditionsBtn, true, 'save');

    const errors = [];
    const condBlocks = document.querySelectorAll("#conditionContainer .condition-block");

    // Reset flag
    ls.isConditionConfigured = false;
    toggleBtnLoader(elements.validateConditionsBtn, false, 'Save');


    if (condBlocks.length === 0) {
        console.log('No condition blocks found');
        notify("At least one condition is mandatory", "error");
        return false;
    }

    for (let i = 0; i < condBlocks.length; i++) {
        const mod = document.getElementById(`condMod${i}`);
        const field = document.getElementById(`condField${i}`);
        const value = document.getElementById(`condValue${i}`);

        let blockErrors = [];

        if (!mod || !mod.value || !field || !field.value || !value || !value.value) {
            blockErrors.push("Please enter the field");
        }

        if (blockErrors.length > 0) {
            const errorMessage = `Condition ${i + 1}: ${blockErrors.join(", ")}`;
            errors.push(errorMessage);
            showValidationError('condition', i, blockErrors.join(", "));
            return false; // Exit on first error
        }
    }

    // All validations passed
    ls.isConditionConfigured = true;
    console.log("✅ Condition blocks validated successfully");
    notify('Condition blocks validated successfully')
    toggleBtnLoader(elements.validateConditionsBtn, false, 'Save');
    $(elements.validateConditionsBtn).html("Saved").attr("disabled", true);

    switchTab(2);
    return true;
}

// Function to show validation error on a specific block
function showValidationError(blockType, index, message) {
    console.log('expected')
    const block = document.querySelector(`#${blockType}Container .${blockType}-block:nth-child(${index + 1})`);
    const errorMsg = document.getElementById(`${blockType === 'condition' ? 'cond' : 'watch'}Error${index}`);

    if (block) {
        block.classList.add("validation-error");

        // Scroll to the error block
        block.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }

    if (errorMsg) {
        errorMsg.textContent = message;
        errorMsg.classList.add("show");
    }
}


function resetConditionValidation() {
    ls.isConditionConfigured = false;
    $(elements.validateConditionsBtn).attr("disabled", false);
    $(elements.validateConditionsBtn).html("Save");
}
function resetWatcherValidation() {
    ls.isWatcherConfigured = false;
    $(elements.validateWatchersBtn).attr("disabled", false);
    $(elements.validateWatchersBtn).html("Save");
}



function addFieldWatchBlock() {
    if (!isAuthenticated) {
        const tabs = document.getElementById("tabs");
        if (tabs) {
            tabs.setAttribute("active-tab", "0");
        }
        return;
    }

    const container = document.getElementById("watchContainer");
    const index = container.children.length;
    const block = document.createElement("div");
    block.className = "watch-block";
    block.innerHTML = `
          <div class="block-header">
            <div class="block-title">Field Monitor ${index + 1}</div>
            <button class="remove-btn" onclick="removeBlock(this)">✕</button>
          </div>
          <div class="field-row two-col">
            <fw-select label="Module" id="watchMod${index}">
              <fw-select-option value="">Select Module</fw-select-option>
              ${modules
            .map(
                (m) =>
                    `<fw-select-option value="${m}">${m.charAt(0).toUpperCase() + m.slice(1)
                    }</fw-select-option>`
            )
            .join("")}
            </fw-select>
            <fw-select label="Fields to Monitor" id="watchFields${index}" multiple>
            </fw-select>
          </div>
          <div class="validation-error-message" id="watchError${index}"></div>
        `;

    container.appendChild(block);
    const modSelect = document.getElementById(`watchMod${index}`);
    modSelect.addEventListener("fwChange", (e) => {
        resetWatcherValidation()
        const idx = e.target.id.replace("watchMod", "");
        loadWatchFields(`watchMod${idx}`, `watchFields${idx}`);
    });

    const modValue = document.getElementById(`watchFields${index}`);
    modValue.addEventListener('fwChange', () => {
        resetWatcherValidation()

    })
}



async function loadWatchFields(modId, fieldId) {
    const modElem = document.getElementById(modId);
    const fieldElem = document.getElementById(fieldId);
    const selectedModule = modElem?.value;

    if (!selectedModule) {
        fieldElem.innerHTML = "";
        return;
    }

    fieldElem.innerHTML =
        '<fw-select-option value="">Loading fields...</fw-select-option>';

    try {
        let fields = fieldsMetadata[selectedModule];

        if (!fields) {
            fields = await fetchFieldsFromAPI(selectedModule, []);
        }

        if (!fields) {
            fieldElem.innerHTML =
                '<fw-select-option value="">Error loading fields</fw-select-option>';
            return;
        }

        fieldElem.innerHTML = "";
        let fieldArray = [];
        fields.fields.forEach((field) => {
            if (field.label && field.name) {
                fieldArray.push({
                    text: field.label,
                    value: field.name,
                });
                fieldElem.options = fieldArray;
            }
        });
    } catch (error) {
        console.error("Error loading watch fields:", error);
    }
}


function saveWatcherBlock() {
    const errors = [];
    const watchBlocks = document.querySelectorAll("#watchContainer .watch-block");

    // Reset flag
    ls.isWatcherConfigured = false;

    if (watchBlocks.length === 0) {
        console.log('No watcher blocks found');
        notify("At least one field monitor is mandatory", "error");
        return false;
    }

    for (let i = 0; i < watchBlocks.length; i++) {
        const modSelect = document.getElementById(`watchMod${i}`);
        const fieldSelect = document.getElementById(`watchFields${i}`);

        let blockErrors = [];

        if (!modSelect || !modSelect.value) {
            blockErrors.push("Module is required");
        }
        if (!fieldSelect || !fieldSelect.value || fieldSelect.value.length === 0) {
            blockErrors.push("At least one field must be selected");
        }

        if (blockErrors.length > 0) {
            const errorMessage = `Field Monitor ${i + 1}: ${blockErrors.join(", ")}`;
            errors.push(errorMessage);
            showValidationError('watch', i, blockErrors.join(", "));
            return false; // Exit on first error
        }
    }

    // All validations passed
    ls.isWatcherConfigured = true;
    console.log("✅ Watcher blocks validated successfully");
    notify('Watcher blocks validated successfully')
    toggleBtnLoader(elements.validateWatchersBtn, false, 'Save');
    $(elements.validateWatchersBtn).html("Saved").attr("disabled", true);
    return true;
}


// Modified removeBlock function specifically for condition blocks
function removeConditionBlock(button) {
    resetConditionValidation();


    const blockToRemove = button.closest(".condition-block");
    const removedFieldSelect = blockToRemove.querySelector('[id^="condField"]');
    const removedField = removedFieldSelect ? removedFieldSelect.value : null;

    console.log(`🗑️ Removing condition block with field: ${removedField}`);
    blockToRemove.remove();

    // Reindex all remaining blocks
    const blocks = document.querySelectorAll("#conditionContainer .condition-block");
    blocks.forEach((block, newIndex) => {
        // Update block title
        block.querySelector(".block-title").textContent = `Condition ${newIndex + 1}`;

        // Update select IDs
        block.querySelector("[id^='condMod']").id = `condMod${newIndex}`;
        block.querySelector("[id^='condField']").id = `condField${newIndex}`;
        block.querySelector("[id^='condValue']").id = `condValue${newIndex}`;
        block.querySelector("[id^='condError']").id = `condError${newIndex}`;

        // Remove and reattach event listeners
        block.querySelector(`[id^='condMod']`).onchange = () => {
            loadFields(`condMod${newIndex}`, `condField${newIndex}`, `condValue${newIndex}`, newIndex);
        };

        block.querySelector(`[id^='condField']`).onchange = () => {
            loadFieldValues(`condMod${newIndex}`, `condField${newIndex}`, `condValue${newIndex}`);
            if (!isPopulating) refreshAllConditionFields();
        };
    });



    setTimeout(() => {
        if (!isPopulating) {
            console.log(`🔄 Refreshing all conditions after removing field: ${removedField}`);
            refreshAllConditionFields();
        }
    }, 100);
}


// Function to refresh ALL condition fields when ANY field is selected/changed
function refreshAllConditionFields() {
    if (isPopulating) return; // Skip refresh during population

    console.log("🔄 Refreshing all condition fields due to field selection change");

    const condBlocks = document.querySelectorAll(
        "#conditionContainer .condition-block"
    );

    condBlocks.forEach((block, index) => {
        const modSelect = document.getElementById(`condMod${index}`);
        const fieldSelect = document.getElementById(`condField${index}`);

        if (modSelect && modSelect.value && fieldSelect) {
            const currentSelectedField = fieldSelect.value;
            console.log(`Refreshing condition ${index + 1}, current field: ${currentSelectedField}`);

            loadFields(
                `condMod${index}`,
                `condField${index}`,
                `condValue${index}`,
                index,
                currentSelectedField
            );
        }
    });
}


function removeBlock(button) {
    resetWatcherValidation();
    button.closest(".condition-block, .watch-block").remove();

    const remainingWatchBlocks = document.querySelectorAll("#watchContainer .watch-block");

    // Set watcher flag based on remaining watch blocks  
    if (remainingWatchBlocks.length === 0) {
        ls.isWatcherConfigured = false;
        console.log("❌ No watcher blocks remaining - watcher flag set to false");
    }


}
