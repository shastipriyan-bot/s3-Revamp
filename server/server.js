const axios = require("axios");

// function checkConditions(conditions, data, modules) {
//   console.log("data checkbox", data?.custom_field?.cf_cohort_record_available);
//   console.log("data radio", data?.custom_field?.cf_undergraduate);
//   console.log("module", modules);
//   console.log("condition", conditions);



//   for (const condition of conditions) {
//     const { module, field, value } = condition;

//     if (module === modules) {


//       const actualValue = data?.custom_field?.[field];
//       console.log("value", value);
//       console.log("actualValue", actualValue);

//       if (actualValue !== value) {
//         return false;
//       }
//     }
//   }

//   return true;
// }


// function checkConditions(conditions, data, modules) {
//   console.log("data available", data);
//   console.log("condition", conditions);
//   // console.log("data available", data?.[field]);
//   // console.log("data available", data?.custom_field?.[field]);
//   // console.log("data checkbox", data?.custom_field?.cf_cohort_record_available);
//   // console.log("data radio", data?.custom_field?.cf_undergraduate);
//   console.log("module", modules);

//   for (const condition of conditions) {
//     const { module, field, value } = condition;

//     if (module === modules) {
//       let actualValue = data?.[field];

//       if (actualValue === undefined) {
//         actualValue = data?.custom_field?.[field];
//       }

//       console.log("value", value);
//       console.log("actualValue", actualValue);

//       if (actualValue !== value) {
//         return false;
//       }
//     }
//   }

//   return true;
// }




function checkConditions(conditions, data, modules) {
  // console.log("data available", data);
  console.log("condition", conditions);
  console.log("module", modules);

  for (const condition of conditions) {
    const { module, field, value } = condition;

    if (module === modules) {
      let actualValue = data?.[field];

      if (actualValue === undefined) {
        actualValue = data?.custom_field?.[field];
      }

      console.log("value", value);
      console.log("actualValue", actualValue);

      // Special logic: if value is "not_empty"
      if (value === "not_empty") {
        if (actualValue === undefined || actualValue === null || actualValue === "") {
          return false; // it's empty → fail
        }
      } else {
        // Normal equality check
        if (actualValue !== value) {
          return false;
        }
      }
    }
  }

  return true;
}




// function hasRelevantFieldChanged(updateData, conditions, watches, currentModule) {
//   if (!updateData || !updateData.custom_fields) return false;

//   const updatedFields = Object.keys(updateData.custom_fields || {});

//   const conditionFields = conditions
//     .filter(c => c.module === currentModule)
//     .map(c => c.field);

//   const watchFields = watches
//     .filter(w => w.module === currentModule)
//     .flatMap(w => w.fields);

//   const allFieldsToWatch = [...new Set([...conditionFields, ...watchFields])];

//   return updatedFields.some(field => allFieldsToWatch.includes(field));
// }





// function checkWatchedFields(watches, data, currentModule) {
//   for (const watch of watches) {
//     const { module, fields } = watch;

//     if (module === currentModule && Array.isArray(fields)) {
//       for (const field of fields) {
//         const value = data?.custom_field?.[field];
//         if (
//           Object.prototype.hasOwnProperty.call(data?.custom_field || {}, field) &&
//           value !== null &&
//           value !== ""
//         ) {
//           return true;
//         }
//       }
//     }
//   }

//   return false;
// }



function hasRelevantFieldChanged(updateData, conditions, watches, currentModule) {
  if (!updateData || typeof updateData !== 'object') return false;

  // All updated fields (top-level and custom_fields)
  const changedFields = new Set([
    ...Object.keys(updateData || {}),
    ...Object.keys(updateData.custom_fields || {})
  ]);

  // Merge condition + watch fields (with null value for watches)
  const conditionFields = conditions
    .filter(c => c.module === currentModule)
    .map(c => ({ field: c.field, value: c.value }));

  const watchFields = watches
    .filter(w => w.module === currentModule)
    .flatMap(w => w.fields.map(field => ({ field, value: null })));

  const allWatched = [...conditionFields, ...watchFields];

  for (const { field, value } of allWatched) {
    if (changedFields.has(field)) {
      const fullChange = updateData[field] ?? updateData.custom_fields?.[field];
      const newValue = Array.isArray(fullChange) ? fullChange[1] : fullChange;

      if (value === "not_empty") {
        if (newValue !== undefined && newValue !== null && newValue !== "") {
          return true; // field has a non-empty new value
        }
      } else {
        // For conditions with specific value OR watchFields (value = null)
        if (value === null || newValue === value) {
          return true;
        }
      }
    }
  }

  return false; // No matching changed field found
}




function checkWatchedFields(watches, data, currentModule) {
  for (const watch of watches) {
    const { module, fields } = watch;

    if (module === currentModule && Array.isArray(fields)) {
      for (const field of fields) {
        let value;
        let fieldExists = false;

        if (Object.prototype.hasOwnProperty.call(data || {}, field)) {
          value = data[field];
          fieldExists = true;
        } else if (Object.prototype.hasOwnProperty.call(data?.custom_field || {}, field)) {
          value = data.custom_field[field];
          fieldExists = true;
        }

        const isValid = value !== undefined && value !== null && value !== '';

        if (fieldExists && isValid) {
          return true;
        }
      }
    }
  }

  return false;
}





function checkConditionFieldsChanged(conditions, updateData, currentModule) {
  console.log(conditions, 'and', updateData)


  for (const condition of conditions) {
    const { module, field } = condition;

    if (module === currentModule) {
      const fieldParts = field.split(".");
      let ref = updateData;

      for (const part of fieldParts) {
        if (ref && ref.custom_fields && Object.prototype.hasOwnProperty.call(ref.custom_fields, part)) {
          ref = ref.custom_fields[part];
        } else {
          ref = null;
          break;
        }
      }

      if (Array.isArray(ref) && ref.length === 2 && ref[0] !== ref[1]) {
        console.log(`✅ Field "${field}" changed from "${ref[0]}" to "${ref[1]}"`);
        return true;
      }
    }
  }

  return false;
}




// function initializeEventListeners(client) {
//   client.events.on("contact.update", function (event) {
//     let data = event.helper.getData();
//     console.log("data",data);

//     const contactUpdateData = data;
//     const conditions = data.iparams.conditions;
//     const hasChanged = checkConditionFieldsChanged(conditions, contactUpdateData, "Contact");

//     if (hasChanged) {
//       processContactUpdate(data);
//     }
//   });

//   client.events.on("deal.update", function (event) {
//     let data = event.helper.getData();
//     const dealUpdateData = data.deal.update;
//     const conditions = data.iparams.conditions;
//     const hasChanged = checkConditionFieldsChanged(conditions, dealUpdateData, "Deal");

//     if (hasChanged) {
//       processDealUpdate(data);
//     }
//   });
// }

exports = {
  onContactCreateHandler: function (args) {
    this.getContactRecord(args);
  },

  // onContactUpdateHandler: async function (args) {
  //   console.log('args data--->>', args.data)
  //   const contact = args.data;
  //   const updateData = contact?.changes?.model_changes;
  //   console.log("Updated Fields:", updateData); // may be empty or undefined
  //   const conditions = args.iparams.conditions;
  //   const watches = args.iparams.watches
  //   // const hasChanged = checkConditionFieldsChanged(
  //   //   conditions,
  //   //   updateData,
  //   //   "Contact"
  //   // );
  //   // console.log("hasChanged", hasChanged)
  //   // if (hasChanged) {
  //   await this.getContactRecord(args);
  //   // }
  // },



  onContactUpdateHandler: async function (args) {
    console.log('args data--->>', args.data);
    const contact = args.data;
    const updateData = contact?.changes?.model_changes;
    console.log("Updated Fields:", updateData);

    const conditions = args.iparams.conditions;
    const watches = args.iparams.watches;

    const shouldTrigger = hasRelevantFieldChanged(
      updateData,
      conditions,
      watches,
      "Contact"
    );

    if (shouldTrigger) {
      await this.getContactRecord(args);
    }
  },







  onDealCreateHandler: function (args) {
    this.getDealRecord(args);
  },

  // onDealUpdateHandler: function (args) {
  //   const deal = args.data;
  //   const updateData = deal?.changes?.model_changes;
  //   console.log("Updated Fields:", updateData); // may be empty or undefined
  //   const conditions = args.iparams.conditions;
  //   const hasChanged = checkConditionFieldsChanged(
  //     conditions,
  //     updateData,
  //     "Deal"
  //   );

  //   if (hasChanged) {
  //     this.getDealRecord(args);
  //   }
  // },

  onDealUpdateHandler: function (args) {
    const deal = args.data;
    const updateData = deal?.changes?.model_changes;
    console.log("Updated Fields:", updateData);

    const conditions = args.iparams.conditions;
    const watches = args.iparams.watches;

    const shouldTrigger = hasRelevantFieldChanged(
      updateData,
      conditions,
      watches,
      "Deal"
    );

    if (shouldTrigger) {
      this.getDealRecord(args);
    }
  },




  onCustomModuleCreateHandler: function (args) {
    if (args.data.custom_module_record.module_name == "cm_cohort_stage_1") {
      this.getCohortOne(args);
    }
    if (args.data.custom_module_record.module_name == "cm_cohort_stage_2") {
      this.getCohortTwo(args);
    }
    if (args.data.custom_module_record.module_name == "cm_cohort_stage_3") {
      this.getCohortThree(args);
    }
    if (
      args.data.custom_module_record.module_name == "cm_alert_logs__call_logs"
    ) {
      let module_name = args.data.custom_module_record.custom_fields.find(
        (field) => field.name == "cf_module_record_type"
      );
      if (module_name.value == "Call Log Record") {
        this.getCallLog(args);
      }
      if (module_name.value == "Alert Log Record") {
        this.getAlertLog(args);
      }
      if (module_name.value == "Audit Log Record") {
        this.getAuditLog(args);
      }
    }
  },
  onCustomModuleUpdateHandler: function (args) {
    const moduleName = args.data.custom_module_record.module_name;
    const modelChanges = args?.data?.changes?.model_changes;
    const conditions = args.iparams.conditions;

    const shouldTrigger = (mod) =>
      checkConditionFieldsChanged(conditions, modelChanges, mod);

    switch (moduleName) {
      case "cm_cohort_stage_1":
        if (shouldTrigger("cm_cohort_stage_1")) this.getCohortOne(args);
        break;

      case "cm_cohort_stage_2":
        if (shouldTrigger("cm_cohort_stage_2")) this.getCohortTwo(args);
        break;

      case "cm_cohort_stage_3":
        if (shouldTrigger("cm_cohort_stage_3")) this.getCohortThree(args);
        break;

      case "cm_alert_logs__call_logs": {
        const typeField = args.data.custom_module_record.custom_fields.find(
          (field) => field.name === "cf_module_record_type"
        );

        const type = typeField?.value;
        if (!type) {
          console.log("❗ Missing cf_module_record_type");
          return;
        }

        if (shouldTrigger("cm_alert_logs__call_logs")) {
          if (type === "Call Log Record") {
            this.getCallLog(args);
          } else if (type === "Alert Log Record") {
            this.getAlertLog(args);
          } else if (type === "Audit Log Record") {
            this.getAuditLog(args);
          } else {
            console.log("⚠️ Unknown record type:", type);
          }
        }

        break;
      }


    }
  },

  // get record by freshsales API section
  getContactRecord: async function (args) {
    // console.log('checking args', args)
    // console.log('checking args', args.data)
    // console.log('checking args', args.data.contact)
    // console.log('checking args', args.data.contact.id)
    try {
      const url = `https://avansefinancialservices-sandbox.myfreshworks.com/crm/sales/api/contacts/${args.data.contact.id}`;
      // const url = `https://avansefinancialservices-sandbox.myfreshworks.com/crm/sales/api/contacts/70117358675`;
      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: "Token token=HLNWqn4r8hVj0UrrEcW6Zg",
      };
      const response = await axios.get(url, { headers });
      let conditions = args.iparams.conditions;
      let data = response.data.contact;
      let watcher = args.iparams.watches;
      const isMatch = checkConditions(conditions, data, "Contact");

      const watch = checkWatchedFields(watcher, data, "Contact");
      console.log("isMatch", isMatch);
      console.log("watch", watch);
      if (isMatch && watch) {
        console.log(
          `The trigger was successfully executed for Contact ID ${args.data.contact.id}`
        );
        await this.contactWebhook(
          JSON.stringify([response.data.contact]),
          args.data.contact.id
        );
      }
    } catch (error) {
      console.log("error in getting the contact id : ", args.data.contact.id, error);
    }
  },
  getDealRecord: async function (args) {
    try {
      const url = `https://avansefinancialservices-sandbox.myfreshworks.com/crm/sales/api/deals/${args.data.deal.id}`;
      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: "Token token=HLNWqn4r8hVj0UrrEcW6Zg",
      };
      const response = await axios.get(url, { headers });
      let conditions = args.iparams.conditions;
      let watcher = args.iparams.watches;
      let data = response.data.deal;

      const isMatch = checkConditions(conditions, data, "Deal");

      const watch = checkWatchedFields(watcher, data, "Deal");
      console.log("isMatch", isMatch);
      console.log("watch", watch);
      if (isMatch && watch) {
        console.log(
          `The trigger was successfully executed for Deal ID ${args.data.deal.id}`
        );
        await this.dealWebhook(
          JSON.stringify([response.data.deal]),
          args.data.deal.id
        );
      }
    } catch (error) {
      console.log("error in getting the deal id : ", args.data.deal.id, error);
    }
  },
  getCohortOne: async function (args) {
    console.log("getCohortOne");

    try {
      const url = `https://avansefinancialservices-sandbox.myfreshworks.com/crm/sales/api/custom_module/cm_cohort_stage_1/${args.data.custom_module_record.id}`;
      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: "Token token=HLNWqn4r8hVj0UrrEcW6Zg",
      };

      const response = await axios.get(url, { headers });
      console.log("response.status :", response.status);
      console.log("response.data :", response.data);
      let conditions = args.iparams.conditions;
      let watcher = args.iparams.watches;
      let data = response.data.cm_cohort_stage_1;

      const isMatch = checkConditions(conditions, data, "cm_cohort_stage_1");

      const watch = checkWatchedFields(watcher, data, "cm_cohort_stage_1");
      console.log("isMatch", isMatch);
      console.log("watch", watch);
      if (isMatch && watch) {
        console.log(
          `The trigger was successfully executed for cohort 1 id  ${args.data.custom_module_record.id}`
        );
        await this.cohortOneWebhook(
          JSON.stringify([response.data.cm_cohort_stage_1]),
          args.data.custom_module_record.id
        );
      }
    } catch (error) {
      console.log(
        "error in getting the cohort 1 id : ",
        args.data.custom_module_record.id
      );
    }
  },
  getCohortTwo: async function (args) {
    try {
      const url = `https://avansefinancialservices-sandbox.myfreshworks.com/crm/sales/api/custom_module/cm_cohort_stage_2/${args.data.custom_module_record.id}`;
      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: "Token token=HLNWqn4r8hVj0UrrEcW6Zg",
      };

      const response = await axios.get(url, { headers });
      console.log("response.status :", response.status);
      let conditions = args.iparams.conditions;
      let watcher = args.iparams.watches;
      let data = response.data.cm_cohort_stage_2;

      const isMatch = checkConditions(conditions, data, "cm_cohort_stage_2");

      const watch = checkWatchedFields(watcher, data, "cm_cohort_stage_2");
      console.log("isMatch", isMatch);
      console.log("watch", watch);
      if (isMatch && watch) {
        console.log(
          `The trigger was successfully executed for cohort 2 id  ${args.data.custom_module_record.id}`
        );
        await this.cohortTwoWebhook(
          JSON.stringify([response.data.cm_cohort_stage_2]),
          args.data.custom_module_record.id
        );
      }
    } catch (error) {
      console.log(
        "error in getting the cohort 2 id : ",
        args.data.custom_module_record.id
      );
    }
  },
  getCohortThree: async function (args) {
    try {
      const url = `https://avansefinancialservices-sandbox.myfreshworks.com/crm/sales/api/custom_module/cm_cohort_stage_3/${args.data.custom_module_record.id}`;
      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: "Token token=HLNWqn4r8hVj0UrrEcW6Zg",
      };

      const response = await axios.get(url, { headers });
      console.log("response.status :", response.status);
      let conditions = args.iparams.conditions;
      let watcher = args.iparams.watches;
      let data = response.data.cm_cohort_stage_3;

      const isMatch = checkConditions(conditions, data, "cm_cohort_stage_3");

      const watch = checkWatchedFields(watcher, data, "cm_cohort_stage_3");
      console.log("isMatch", isMatch);
      console.log("watch", watch);
      if (isMatch && watch) {
        console.log(
          `The trigger was successfully executed for cohort 3 id  ${args.data.custom_module_record.id}`
        );
        await this.cohortThreeWebhook(
          JSON.stringify([response.data.cm_cohort_stage_3]),
          args.data.custom_module_record.id
        );
      }
    } catch (error) {
      console.log(
        "error in getting the cohort 3 id : ",
        args.data.custom_module_record.id
      );
    }
  },
  getAlertLog: async function (args) {
    try {
      const url = `https://avansefinancialservices-sandbox.myfreshworks.com/crm/sales/api/custom_module/cm_alert_logs__call_logs/${args.data.custom_module_record.id}`;
      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: "Token token=HLNWqn4r8hVj0UrrEcW6Zg",
      };

      const response = await axios.get(url, { headers });
      console.log("response.status :", response.status);
      let conditions = args.iparams.conditions;
      let watcher = args.iparams.watches;
      let data = response.data.cm_alert_logs__call_logs;

      const isMatch = checkConditions(
        conditions,
        data,
        "cm_alert_logs__call_logs"
      );

      const watch = checkWatchedFields(
        watcher,
        data,
        "cm_alert_logs__call_logs"
      );
      console.log("isMatch", isMatch);
      console.log("watch", watch);
      if (isMatch && watch) {
        console.log(
          `The trigger was successfully executed for alert log id ${args.data.custom_module_record.id}`
        );
        await this.alertLogWebhook(
          JSON.stringify([response.data.cm_alert_logs__call_logs]),
          args.data.custom_module_record.id
        );
      }
    } catch (error) {
      console.log(
        "error in getting the alert log id : ",
        args.data.custom_module_record.id
      );
    }
  },
  getCallLog: async function (args) {
    try {
      const url = `https://avansefinancialservices-sandbox.myfreshworks.com/crm/sales/api/custom_module/cm_alert_logs__call_logs/${args.data.custom_module_record.id}`;
      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: "Token token=HLNWqn4r8hVj0UrrEcW6Zg",
      };

      const response = await axios.get(url, { headers });
      console.log("response.status :", response.status);
      let conditions = args.iparams.conditions;
      let watcher = args.iparams.watches;
      let data = response.data.cm_alert_logs__call_logs;

      const isMatch = checkConditions(
        conditions,
        data,
        "cm_alert_logs__call_logs"
      );

      const watch = checkWatchedFields(
        watcher,
        data,
        "cm_alert_logs__call_logs"
      );
      console.log("isMatch", isMatch);
      console.log("watch", watch);
      if (isMatch && watch) {
        console.log(
          `The trigger was successfully executed for call log id ${args.data.custom_module_record.id}`
        );
        await this.callLogWebhook(
          JSON.stringify([response.data.cm_alert_logs__call_logs]),
          args.data.custom_module_record.id
        );
      }
    } catch (error) {
      console.log(
        "error in getting the call log id : ",
        args.data.custom_module_record.id
      );
    }
  },
  getAuditLog: async function (args) {
    try {
      const url = `https://avansefinancialservices-sandbox.myfreshworks.com/crm/sales/api/custom_module/cm_alert_logs__call_logs/${args.data.custom_module_record.id}`;
      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: "Token token=HLNWqn4r8hVj0UrrEcW6Zg",
      };

      const response = await axios.get(url, { headers });
      console.log("response.status :", response.status);
      let conditions = args.iparams.conditions;
      let watcher = args.iparams.watches;
      let data = response.data.cm_alert_logs__call_logs;

      const isMatch = checkConditions(
        conditions,
        data,
        "cm_alert_logs__call_logs"
      );

      const watch = checkWatchedFields(
        watcher,
        data,
        "cm_alert_logs__call_logs"
      );
      console.log("isMatch", isMatch);
      console.log("watch", watch);
      if (isMatch && watch) {
        console.log(
          `The trigger was successfully executed for audit log id ${args.data.custom_module_record.id}`
        );
        await this.auditLogWebhook(
          JSON.stringify([response.data.cm_alert_logs__call_logs]),
          args.data.custom_module_record.id
        );
      }
    } catch (error) {
      console.log(
        "error in getting the audit log id : ",
        args.data.custom_module_record.id
      );
    }
  },

  //triggering webhook to Konnectify section
  contactWebhook: async function (args, id) {
    console.log("contact webhook");

    try {
      const body = { totalarray: args, id: id };

      let result = await axios({
        method: "post",
        // url: "https://hooks.konnectify.co/webhook/v1/HXszj5jbus",
        url: 'https://hooks.konnectify.co/webhook/v1/FYEgeuWTkn',
        data: body,
      });
      console.log("webhook result :", result.status);
    } catch (error) {
      console.log("error in triggering the webhook for contact ID :", id);
    }
  },

  dealWebhook: async function (args, id) {
    try {
      const body = { totalarray: args, id: id };

      let result = await axios({
        method: "post",
        // url: "https://hooks.konnectify.co/webhook/v1/OLnhlMyZbQ",
        url: 'https://hooks.konnectify.co/webhook/v1/FYEgeuWTkn',
        data: body,
      });
      console.log("result :", result);
    } catch (error) {
      console.log("error in triggering the webhook for deal ID :", id);
    }
  },
  cohortOneWebhook: async function (args, id) {
    try {
      const body = { totalarray: args, id: id };

      let result = await axios({
        method: "post",
        // url: "https://hooks.konnectify.co/webhook/v1/ke8jzqmLoq",
        url: 'https://hooks.konnectify.co/webhook/v1/FYEgeuWTkn',
        data: body,
      });
      console.log("result :", result);
    } catch (error) {
      console.log("error in triggering the webhook for cohort 1 ID :", id);
    }
  },
  cohortTwoWebhook: async function (args, id) {
    try {
      const body = { totalarray: args, id: id };

      let result = await axios({
        method: "post",
        // url: "https://hooks.konnectify.co/webhook/v1/qXNogIcgfq",
        url: 'https://hooks.konnectify.co/webhook/v1/FYEgeuWTkn',
        data: body,
      });
      console.log("result :", result);
    } catch (error) {
      console.log("error in triggering the webhook for cohort 2 ID :", id);
    }
  },
  cohortThreeWebhook: async function (args, id) {
    try {
      const body = { totalarray: args, id: id };

      let result = await axios({
        method: "post",
        // url: "https://hooks.konnectify.co/webhook/v1/ppRrjcr3CH",
        url: 'https://hooks.konnectify.co/webhook/v1/FYEgeuWTkn',
        data: body,
      });
      console.log("result :", result);
    } catch (error) {
      console.log("error in triggering the webhook for cohort 3 ID :", id);
    }
  },
  callLogWebhook: async function (args, id) {
    try {
      const body = { totalarray: args, id: id };

      let result = await axios({
        method: "post",
        // url: "https://hooks.konnectify.co/webhook/v1/OyFkzUate7",
        url: 'https://hooks.konnectify.co/webhook/v1/FYEgeuWTkn',
        data: body,
      });
      console.log("result :", result);
    } catch (error) {
      console.log("error in triggering the webhook for call log ID :", id);
    }
  },
  alertLogWebhook: async function (args, id) {
    try {
      const body = { totalarray: args, id: id };

      let result = await axios({
        method: "post",
        // url: "https://hooks.konnectify.co/webhook/v1/uQy6gxchv8",
        url: 'https://hooks.konnectify.co/webhook/v1/FYEgeuWTkn',
        data: body,
      });
      console.log("result :", result);
    } catch (error) {
      console.log("error in triggering the webhook for alert log ID :", id);
    }
  },
  auditLogWebhook: async function (args, id) {
    try {
      const body = { totalarray: args, id: id };

      let result = await axios({
        method: "post",
        // url: "https://hooks.konnectify.co/webhook/v1/K5q6brACrr",
        url: 'https://hooks.konnectify.co/webhook/v1/FYEgeuWTkn',
        data: body,
      });
      console.log("result :", result);
    } catch (error) {
      console.log("error in triggering the webhook for audit log ID :", id);
    }
  },
};
