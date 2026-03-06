// x12_837_parser.js — Full Loop-Aware Parser with Deep Coverage and Logic

// /opt/homebrew/opt/mongodb-community@4.4/bin/mongod --dbpath ~/documents/data/db


import needle from 'needle';


export function parseX12File(content) {
  console.log('content',content);
    const segments = content
      .split(/\r?\n|~/)
      .map((seg) => seg.trim())
      .filter(Boolean);
  
    const claims = [];
    let currentClaim = null;
    let currentService = null;
    let currentEnvelope = null;
    let currentFunctionalGroup = null;
    let currentEntityType = null;
    let currentAddressBuffer = {};
    let loopStack = [];
    let lastEntityType = null;
  
    const map = {
      '41': 'submitter',
      '40': 'receiver',
      '85': 'provider',
      '87': 'serviceProvider',
      'IL': 'subscriber',
      'QC': 'patient',
      '71': 'renderingProvider',
      'PR': 'payer',
      'DN': 'referringProvider',
      '72': 'supervisingProvider',
      '73': 'orderingProvider',
      '77': 'serviceLocation',
      '36': 'employer',
      'ZZ': 'otherEntity'
    };
  
    function getLoopContext(loopId) {
      if (!currentClaim.loops) currentClaim.loops = {};
      if (!currentClaim.loops[loopId]) currentClaim.loops[loopId] = {};
      return currentClaim.loops[loopId];
    }
  
    function normalizeLoops(claim) {
      const result = {};
      const loops = claim.loops || {};
  
      result.header = loops.header || {};
  
      for (const [loopId, data] of Object.entries(loops)) {
        if (loopId === 'header') continue;
  
        const keys = Object.keys(data);
  
        if (keys.includes('provider')) {
          result.billingProvider = data;
        }
  
        if (keys.includes('subscriber')) {
          result.subscriber = {
            ...data.subscriber,
            address: data.address,
            demographics: data.demographics,
            payer: data.payer,
            renderingProvider: data.renderingProvider,
            contact: data.contact
          };
        }
  
        if (keys.includes('patient')) {
          result.patient = {
            ...data.patient,
            address: data.address,
            demographics: data.demographics,
            contact: data.contact
          };
        }
  
        if (loopId === '2000B' && data.subscriberInfo) {
          result.subscriber = result.subscriber || {};
          result.subscriber.subscriberInfo = data.subscriberInfo;
        }
      }
  
      claim.loops = result;
    }
  
    for (let i = 0; i < segments.length; i++) {
      const parts = segments[i].split("*");
      const tag = parts[0];
  
      switch (tag) {
        case "ISA":
          currentEnvelope = {
            senderId: parts[6] || '',
            receiverId: parts[8] || '',
            date: parts[9] || '',
            time: parts[10] || '',
            controlNumber: parts[13] || '',
            usageIndicator: parts[14] || ''
          };
          break;
  
        case "GS":
          currentFunctionalGroup = {
            functionalIdCode: parts[1] || '',
            senderCode: parts[2] || '',
            receiverCode: parts[3] || '',
            date: parts[4] || '',
            time: parts[5] || '',
            controlNumber: parts[6] || '',
            responsibleAgencyCode: parts[7] || '',
            version: parts[8] || ''
          };
          break;
  
        case "GE":
          if (currentFunctionalGroup) {
            currentFunctionalGroup.groupTrailer = {
              numberOfTransactionSets: parts[1] || '',
              controlNumber: parts[2] || ''
            };
          }
          break;
  
        case "IEA":
          if (currentEnvelope) {
            currentEnvelope.interchangeTrailer = {
              numberOfGroups: parts[1] || '',
              controlNumber: parts[2] || ''
            };
          }
          break;
  
        case "ST":
          currentClaim = {
            envelope: currentEnvelope,
            functionalGroup: currentFunctionalGroup,
            transaction: {
              transactionSetId: parts[1] || '',
              controlNumber: parts[2] || '',
              implementationConventionReference: parts[3] || ''
            },
            loops: {},
            notes: [],
            serviceLines: [],
            diagnoses: [],
            adjustments: [],
            attachments: [],
            forms: [],
            dates: [],
            amounts: [],
            k3: [],
            otherInsurances: []
          };
          loopStack = [];
          break;
  
        case "BHT":
          currentClaim.batchHeader = {
            hierarchicalStructureCode: parts[1] || '',
            transactionSetPurposeCode: parts[2] || '',
            referenceIdentification: parts[3] || '',
            date: parts[4] || '',
            time: parts[5] || '',
            transactionTypeCode: parts[6] || ''
          };
          break;
  
        case "HL":
          const loopId = `${parts[3]}_${parts[1]}`;
          loopStack.push(loopId);
          break;
  
        case "NM1":
          currentEntityType = parts[1];
          lastEntityType = currentEntityType;
          const entity = {
            entityType: parts[1] || '',
            entityTypeQualifier: parts[2] || '',
            name: parts[3] || '',
            firstName: parts[4] || '',
            middleName: parts[5] || '',
            namePrefix: parts[6] || '',
            nameSuffix: parts[7] || '',
            idQualifier: parts[8] || '',
            id: parts[9] || ''
          };
          const loopName = loopStack[loopStack.length - 1] || 'header';
          const ctx = getLoopContext(loopName);
          ctx[map[currentEntityType] || `entity_${currentEntityType}`] = entity;
          break;
  
        case "REF":
          const refObj = { qualifier: parts[1] || '', id: parts[2] || '' };
          const loop = getLoopContext(loopStack[loopStack.length - 1] || 'header');
          if (lastEntityType) {
            loop[`ref_${lastEntityType}`] = loop[`ref_${lastEntityType}`] || [];
            loop[`ref_${lastEntityType}`].push(refObj);
          } else if (currentService) {
            currentService.references = currentService.references || [];
            currentService.references.push(refObj);
          } else if (currentClaim) {
            currentClaim.claimInfo = currentClaim.claimInfo || {};
            currentClaim.claimInfo.references = currentClaim.claimInfo.references || [];
            currentClaim.claimInfo.references.push(refObj);
          }
          break;
  
        case "N2":
          currentAddressBuffer.address2 = parts[1] || '';
          break;
  
        case "N3":
          currentAddressBuffer.address1 = parts[1] || '';
          break;
  
        case "N4":
          currentAddressBuffer.city = parts[1] || '';
          currentAddressBuffer.state = parts[2] || '';
          currentAddressBuffer.zip = parts[3] || '';
          getLoopContext(loopStack[loopStack.length - 1] || 'header').address = { ...currentAddressBuffer };
          currentAddressBuffer = {};
          break;
  
        case "PER":
          getLoopContext(loopStack[loopStack.length - 1] || 'header').contact = {
            contactFunctionCode: parts[1] || '',
            name: parts[2] || '',
            communicationNumberQualifier: parts[3] || '',
            communicationNumber: parts[4] || ''
          };
          break;
  
        case "SBR":
          currentClaim.otherInsurances.push({
            responsibilityCode: parts[1] || '',
            relationshipCode: parts[2] || '',
            referenceId: parts[3] || '',
            name: parts[4] || '',
            insuranceTypeCode: parts[5] || ''
          });
          break;
  
        case "PAT":
          getLoopContext('2000C').patient = { relationshipToSubscriber: parts[1] || '' };
          break;
  
        case "DMG":
          getLoopContext(loopStack[loopStack.length - 1] || 'header').demographics = {
            dob: parts[2] || '',
            gender: parts[3] || ''
          };
          break;
  
        case "DTP":
          const dtpLoop = getLoopContext(loopStack[loopStack.length - 1] || 'header');
          dtpLoop.dates = dtpLoop.dates || [];
          dtpLoop.dates.push({
            dateType: parts[1] || '',
            format: parts[2] || '',
            date: parts[3] || ''
          });
          break;
  
        case "CLM":
          currentClaim.claimInfo = {
            claimId: parts[1] || '',
            totalAmount: parseFloat(parts[2]) || 0,
            facilityCode: parts[5] || '',
            frequencyCode: parts[6] || ''
          };
          break;
  
        case "CL1":
          currentClaim.claimInfo = currentClaim.claimInfo || {};
          currentClaim.claimInfo.classification = {
            admissionType: parts[1] || '',
            source: parts[2] || '',
            dischargeStatus: parts[3] || ''
          };
          break;
  
        case "HI":
          for (let j = 1; j < parts.length; j++) {
            const [qual, code] = parts[j].split(/[:>]/);
            if (code) {
              currentClaim.diagnoses.push({ qualifier: qual, code });
            }
          }
          break;
  
        case "NTE":
          currentClaim.notes.push(parts[2] || '');
          break;
  
        case "LX":
          currentService = { lineNumber: parts[1] || '' };
          currentClaim.serviceLines.push(currentService);
          break;
  
        case "SV2":
          const [hcpcs, modifiers] = (parts[2] || '').split(/>>?/);
          Object.assign(currentService, {
            revenueCode: parts[1] || '',
            hcpcs: hcpcs || '',
            modifiers: modifiers?.split('>') || [],
            chargeAmount: parseFloat(parts[3]) || 0,
            unit: parts[4] || '',
            quantity: parseInt(parts[5]) || 0
          });
          break;
  
        case "SV1":
          const svcParts = (parts[1] || '').split('>');
          Object.assign(currentService, {
            procedureCode: svcParts[1] || '',
            hcpcs: svcParts[0] || '',
            modifiers: svcParts.slice(2),
            chargeAmount: parseFloat(parts[2]) || 0,
            unit: parts[4] || '',
            quantity: parseInt(parts[5]) || 0
          });
          break;
  
        case "HCP":
          const pricing = {
            repricedAmount: parseFloat(parts[2]) || 0,
            savingsAmount: parseFloat(parts[3]) || 0,
            method: parts[4] || ''
          };
          if (currentService) currentService.pricing = pricing;
          else currentClaim.pricing = pricing;
          break;
  
        case "LIN":
          if (currentService) currentService.ndc = parts[3] || '';
          break;
  
        case "CTP":
          if (currentService) {
            currentService.unitPrice = parseFloat(parts[4]) || 0;
            currentService.unitOfMeasure = parts[5] || '';
          }
          break;
  
        case "CAS":
          currentClaim.adjustments.push({
            groupCode: parts[1] || '',
            reasonCode: parts[2] || '',
            amount: parseFloat(parts[3]) || 0
          });
          break;
  
        case "AMT":
          currentClaim.amounts.push({
            qualifier: parts[1] || '',
            amount: parseFloat(parts[2]) || 0
          });
          break;
  
        case "CN1":
          currentClaim.contract = {
            type: parts[1] || '',
            amount: parts[2] || '',
            percent: parts[3] || ''
          };
          break;
  
        case "PWK":
          currentClaim.attachments.push({
            reportType: parts[1] || '',
            transmissionCode: parts[2] || '',
            controlNumber: parts[5] || ''
          });
          break;
  
        case "K3":
          currentClaim.k3.push(parts.slice(1).join("*"));
          break;
  
        case "LQ":
          currentClaim.forms.push({ qualifier: parts[1] || '', code: parts[2] || '' });
          break;
  
        case "FRM":
          if (currentClaim.forms.length > 0) {
            currentClaim.forms[currentClaim.forms.length - 1].text = parts.slice(1).join("*");
          }
          break;
  
        case "OI":
          currentClaim.otherInsurance = {
            assignment: parts[1] || '',
            release: parts[2] || '',
            signature: parts[3] || ''
          };
          break;
  
        case "MOA":
          currentClaim.moa = {
            codes: parts.slice(1, 6),
            qualifier: parts[6] || '',
            amount: parts[7] || ''
          };
          break;
  
        case "SE":
          normalizeLoops(currentClaim);
          claims.push(currentClaim);
          currentClaim = null;
          currentService = null;
          loopStack = [];
          break;
      }
    }
  
    return {
      envelope: currentEnvelope,
      functionalGroup: currentFunctionalGroup,
      claims
    };
}
export function getDetails(entity) {
//   const nameParts = [
//     entity.namePrefix,
//     entity.firstName,
//     entity.middleName,
//     entity.name,
//     entity.nameSuffix
//   ].filter(part => part && part.length > 0);
  
//   return {
//     name: nameParts.join(' '),
//     id: entity.id,
//     idQualifier: entity.idQualifier
//   }
}

export async function getGeo(address) {
    let search = encodeURIComponent(`${address.address1},${address.city},${address.state},${address.zip.slice(0, 5)}`);
    let surl = process.env.GOOGLE_API_PLACES_URL + search + `&key=${process.env.GOOGLE_API_KEY}`;
    console.log(surl);
    const response = await needle('get', surl);
    console.log(response.body);
    return response.body;
}

export async function addGeoX12(xd) {
    const claims = xd.claims || [];

    // for (let i = 0; i < claims.length; i++) {
    //     const claim = claims[i];
    //   console.log(claim);

    //     if(claim.loops.subscriber?.address){
    //       let sgeoget = await getGeo(claim.loops.subscriber.address);
    //       let r = sgeoget.results[0];
    //       let sgeo = {
    //           lat: r.geometry.location.lat,
    //           lng: r.geometry.location.lng,
    //       }

    //       claim.loops.subscriber.geo = sgeo;

    //     }
        

    //     if(claim.loops.patient?.address){
    //       let patgeoget = await getGeo(claim.loops.patient?.address);
    //       if(patgeoget){
    //           let pat = patgeoget.results[0];
    //           let patgeo = {
    //               lat: pat.geometry.location.lat,
    //               lng: pat.geometry.location.lng,
    //           }
    //           claim.loops.patient.geo = patgeo;
    //       }

    //     }

        
    //     if(claim.loops.billingProvider?.address){
    //       let pgeoget = await getGeo(claim.loops.billingProvider.address);
    //       let rp = pgeoget.results[0];
    //       let pgeo = {
    //           lat: rp.geometry.location.lat,
    //           lng: rp.geometry.location.lng,
    //       }
    //       claim.loops.billingProvider.geo = pgeo;
    //     }
        

        
        

       

    // }

    xd.claims = claims;
    return xd;
  
}

export async function processX12(x12, type='reprice', markUp=1.5) {
    let repriceUrl = process.env.REPRICE_URL;
    // auditOnly = true;
    const x12Buffer = Buffer.from(x12); // if x12 is a string, otherwise use as-is

    const formData = {
      'files': {
        buffer: x12Buffer,
        filename: 'claim.x12',
        content_type: 'text/plain'
      },
      'auditOnly': type == 'audit',
      markUp: markUp
    };
    

    try {
        const response = await needle('post', repriceUrl, formData, {
            multipart: true
        });
        let repriceRaw = response.body[0];
        if(repriceRaw?.length < 500){
          return {
            error: 'Reprice failed'
          }
        }
        console.log('reprice response',response.body);
        if(response.body.length < 1){
          return null;
        }
        // console.log('repriceRaw',repriceRaw);
        const x12Data = parseX12File(repriceRaw);

        let addGeo = await addGeoX12(x12Data);
        // console.log(addGeo);
        
        let parsedData = {
            type: 'x12',
            file: addGeo,
            raw: repriceRaw
        };


        return parsedData;
    } catch (error) {
        console.error('Reprice error:', error);
        throw error;
    }
}

export function buildSlimX12(xd) {
  const claims = xd.claims || [];

  let slimClaims = xd.claims.map(claim => {
    return {
      id: claim.claimInfo.claimId,
      submitter: xd.loops.header.submitter.name,
      receiver: xd.loops.header.receiver.name,
      amount: claim.claimInfo.totalAmount,
      facilityCode: claim.claimInfo.facilityCode,
      provider: claim.billingProvider.provider.name,
      providerId: claim.billingProvider.provider.id,
      subscriber: getDetails(claim.subscriber),

      

    }
  });

  let slimFile = {
    senderCode: xd.functionalGroup.senderCode,
    receiverCode: xd.functionalGroup.receiverCode,
    date: xd.functionalGroup.date,
    time: xd.functionalGroup.time,
    controlNumber: xd.functionalGroup.controlNumber,
    
  }

    
}
  
  
  

  // x12_835_parser.js — Fully Comprehensive Parser for Payment Remittance (835)

export function parseX12_835(content) {
    const segments = content
      .split(/\r?\n|~/)
      .map((seg) => seg.trim())
      .filter(Boolean);
  
    const payments = [];
    let currentPayment = null;
    let currentClaim = null;
    let currentService = null;
    let currentAdjustment = null;
  
    let currentEnvelope = null;
    let currentFunctionalGroup = null;
  
    for (let i = 0; i < segments.length; i++) {
      const parts = segments[i].split("*");
      const tag = parts[0];
  
      switch (tag) {
        // Interchange Control Header — envelope
        case "ISA":
          currentEnvelope = {
            senderId: parts[6]?.trim() || '',
            receiverId: parts[8]?.trim() || '',
            date: parts[9] || '',
            time: parts[10] || '',
            controlNumber: parts[13] || '',
            usageIndicator: parts[14] || '',
          };
          break;
  
        // Functional Group Header
        case "GS":
          currentFunctionalGroup = {
            functionalIdCode: parts[1] || '',
            senderCode: parts[2] || '',
            receiverCode: parts[3] || '',
            date: parts[4] || '',
            time: parts[5] || '',
            controlNumber: parts[6] || '',
            responsibleAgencyCode: parts[7] || '',
            version: parts[8] || '',
          };
          break;
  
        // Transaction Set Header
        case "ST":
          currentPayment = {
            envelope: currentEnvelope,
            functionalGroup: currentFunctionalGroup,
            transaction: {
              transactionSetId: parts[1] || '',
              controlNumber: parts[2] || '',
            },
            paymentInfo: {},
            payee: {},
            claims: [],
            providerAdjustments: [],
            notes: []
          };
          break;
  
        // Payment Information
        case "BPR":
          currentPayment.paymentInfo = {
            transactionHandlingCode: parts[1],
            totalPaymentAmount: parseFloat(parts[2]) || 0,
            paymentMethod: parts[3],
            paymentFormat: parts[4],
            senderBankId: parts[6],
            senderAccount: parts[8],
            receiverBankId: parts[12],
            receiverAccount: parts[14],
            paymentDate: parts[16],
          };
          break;
  
        // Payee Name
        case "N1":
          currentPayment.payee = {
            entityIdentifierCode: parts[1],
            name: parts[2],
            idQualifier: parts[3],
            id: parts[4]
          };
          break;
  
        // Claim Payment Info
        case "CLP":
          if (currentClaim) {
            currentPayment.claims.push(currentClaim);
          }
          currentClaim = {
            claimId: parts[1],
            statusCode: parts[2],
            totalChargeAmount: parseFloat(parts[3]) || 0,
            paymentAmount: parseFloat(parts[4]) || 0,
            patientResponsibility: parseFloat(parts[5]) || 0,
            payerClaimControlNumber: parts[7],
            facilityCode: parts[8],
            claimFrequencyCode: parts[9],
            serviceLines: [],
            adjustments: [],
            references: [],
            dates: [],
            moa: {},
            patient: {},
            payer: {}
          };
          break;
  
        // Service Line Payment
        case "SVC":
          currentService = {
            procedure: parts[1],
            lineChargeAmount: parseFloat(parts[2]) || 0,
            linePaidAmount: parseFloat(parts[3]) || 0,
            revenueCode: parts[4] || '',
            quantity: parts[5] || '',
            adjustments: []
          };
          currentClaim.serviceLines.push(currentService);
          break;
  
        // Service line-level adjustment
        case "CAS":
          const adjustment = {
            groupCode: parts[1],
            reasonCode: parts[2],
            adjustmentAmount: parseFloat(parts[3]) || 0
          };
          if (currentService) {
            currentService.adjustments.push(adjustment);
          } else if (currentClaim) {
            currentClaim.adjustments.push(adjustment);
          }
          break;
  
        // Claim-level Reference ID
        case "REF":
          currentClaim.references.push({ qualifier: parts[1], id: parts[2] });
          break;
  
        // Claim-level Dates
        case "DTM":
          currentClaim.dates.push({
            dateQualifier: parts[1],
            date: parts[2]
          });
          break;
  
        // Medicare Outpatient Adjudication
        case "MOA":
          currentClaim.moa = {
            codes: parts.slice(1, 6),
            qualifier: parts[6] || '',
            amount: parts[7] || ''
          };
          break;
  
        // Patient or Payer entity
        case "NM1":
          const entityType = parts[1];
          const entity = {
            entityTypeQualifier: parts[2],
            name: parts[3],
            idQualifier: parts[8],
            id: parts[9]
          };
          if (entityType === 'QC') currentClaim.patient = entity;
          else if (entityType === 'PR') currentClaim.payer = entity;
          break;
  
        // Notes or remark codes
        case "NTE":
          currentPayment.notes.push(parts[2] || '');
          break;
  
        // Provider-Level Balance Adjustment
        case "PLB":
          currentPayment.providerAdjustments.push({
            providerId: parts[1],
            fiscalPeriod: parts[2],
            reasonCode: parts[3],
            amount: parseFloat(parts[4]) || 0
          });
          break;
  
        // Transaction Set Trailer
        case "SE":
          if (currentClaim) {
            currentPayment.claims.push(currentClaim);
            currentClaim = null;
          }
          payments.push(currentPayment);
          currentPayment = null;
          currentAdjustment = null;
          break;
      }
    }
  
    return {
      envelope: currentEnvelope,
      functionalGroup: currentFunctionalGroup,
      payments
    };
}



// x12_mesh_837_835.js — Merge 837 claims with 835 payments using claimId

export function mesh837and835(parsed837, parsed835) {
    const claims837 = parsed837.claims || [];
    const payments835 = parsed835.payments || [];
  
    // Flatten all 835 claims
    const flat835Claims = payments835.flatMap(p => p.claims || []);
  
    // Build a lookup by claim ID
    const paymentMap = Object.fromEntries(
      flat835Claims.map(claim => [claim.claimId, claim])
    );
  
    const merged = claims837.map(claim837 => {
      const claimId = claim837.claimInfo?.claimId || null;
      const paid = paymentMap[claimId] || null;
  
      return {
        claimId,
        billedAmount: claim837.claimInfo?.totalAmount || 0,
        paidAmount: paid?.paymentAmount || 0,
        statusCode: paid?.statusCode || null,
        adjustments: paid?.adjustments || [],
        patientResponsibility: paid?.patientResponsibility || 0,
        billedServices: (claim837.serviceLines || []).map(line => ({
          procedure: line.hcpcs || '',
          chargeAmount: line.chargeAmount || 0,
          quantity: line.quantity || 0
        })),
        paidServices: (paid?.serviceLines || []).map(line => ({
          procedure: line.procedure || '',
          paidAmount: line.linePaidAmount || 0,
          adjustments: line.adjustments || []
        }))
      };
    });
  
    return merged;
}

  
  