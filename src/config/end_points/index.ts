export  const EndPoints = {

  BACKOFFICE: {
    // Simulator
       POST_GENERATE_PRE_APROBATE: '/apiprospectos/simulator/postGeneratePreAprobate',

    // Create Prospect RIESGO
       POST_CREATE_PROSPECT_RIESGO: '/apiprospectos/prospect/postCreateProspectRiesgo',
  },
  KIWIPAY: {
     // Departments
     GET_DEPARTMENTS: '/apiprospectos/departments/getDepartments',
     // Provinces
        GET_PROVINCES: '/apiprospectos/provinces/getProvinces',
     // Districts
        GET_DISTRICTS: '/apiprospectos/districts/getDistricts',
     // CRUD DE DATOS DE CLIENTE
        GET_CLIENT_DATA: '/apiprospectos/client/getData',
        POST_CREATE_CLIENT: '/apiprospectos/client/postCreateClient',
        PUT_UPDATE_CLIENT: '/apiprospectos/client/putUpdateClient',
        DELETE_CLIENT: '/apiprospectos/client/deleteClient',
     // CRUD DE DATOS DE PACIENTE
        GET_PATIENT_DATA: '/apiprospectos/patient/getData',
        POST_CREATE_PATIENT: '/apiprospectos/patient/postCreatePatient',
        PUT_UPDATE_PATIENT: '/apiprospectos/patient/putUpdatePatient',
        DELETE_PATIENT: '/apiprospectos/patient/deletePatient',
     // CRUD DE DATOS DE CONYUGE
        GET_CONYUGE_DATA: '/apiprospectos/conyuge/getData',
        POST_CREATE_CONYUGE: '/apiprospectos/conyuge/postCreateConyuge',
        PUT_UPDATE_CONYUGE: '/apiprospectos/conyuge/putUpdateConyuge',
        DELETE_CONYUGE: '/apiprospectos/conyuge/deleteConyuge',
     // CRUD DE DATOS DE AVALISTA
        GET_AVALISTA_DATA: '/apiprospectos/avalista/getData',
        POST_CREATE_AVALISTA: '/apiprospectos/avalista/postCreateAvalista',
        PUT_UPDATE_AVALISTA: '/apiprospectos/avalista/putUpdateAvalista',
        DELETE_AVALISTA: '/apiprospectos/avalista/deleteAvalista',
     // CRUD DE DATOS DE DOCUMENTOS
        GET_DOCUMENTOS_DATA: '/apiprospectos/documentos/getData',
        POST_CREATE_DOCUMENTOS: '/apiprospectos/documentos/postCreateDocumentos',
        PUT_UPDATE_DOCUMENTOS: '/apiprospectos/documentos/putUpdateDocumentos',
        DELETE_DOCUMENTOS: '/apiprospectos/documentos/deleteDocumentos',
     // CRUD DE DATOS DE PROSPECTO-RIESGO
        GET_PROSPECTO_RIESGO_DATA: '/apiprospectos/prospectoRiesgo/getData',
        PUT_UPDATE_PROSPECTO_RIESGO: '/apiprospectos/prospectoRiesgo/putUpdateProspectRiesgo',
  }
}

export default EndPoints;
