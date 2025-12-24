/**
 * Patient Controller
 * Handles patient management operations
 */

const { v4: uuidv4 } = require('uuid');
const Patient = require('../models/Patient');
const { logger } = require('../utils/logger');

/**
 * Create a new patient
 */
const createPatient = async (req, res) => {
  try {
    const { name, age, gender, village, district, state, medical_history } = req.body;
    const assigned_worker_id = req.user.role === 'healthcare_worker' ? req.user.id : null;

    const patient = await Patient.create({
      id: uuidv4(),
      user_id: null, // Can link to user account if patient registers
      age,
      gender,
      village,
      district,
      state,
      assigned_worker_id: assigned_worker_id || req.body.assigned_worker_id,
      medical_history: medical_history || {},
    });

    logger.info(`Patient created: ${patient.id} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      data: {
        patient: {
          id: patient.id,
          name,
          age: patient.age,
          gender: patient.gender,
          village: patient.village,
          district: patient.district,
          state: patient.state,
          assigned_worker_id: patient.assigned_worker_id,
          created_at: patient.created_at,
        },
      },
    });
  } catch (error) {
    logger.error(`Create patient error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to create patient',
      },
    });
  }
};

/**
 * Get list of patients (paginated)
 */
const getPatients = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search;

    // Role-based filtering
    let filter = {};
    if (req.user.role === 'healthcare_worker') {
      filter.assigned_worker_id = req.user.id;
    } else if (req.user.role === 'patient') {
      filter.user_id = req.user.id;
    }

    const { patients, total } = await Patient.findAll({
      filter,
      search,
      limit,
      offset,
    });

    res.json({
      success: true,
      data: {
        patients,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error(`Get patients error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch patients',
      },
    });
  }
};

/**
 * Get patient by ID
 */
const getPatient = async (req, res) => {
  try {
    const { id } = req.params;

    const patient = await Patient.findById(id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Patient not found',
        },
      });
    }

    // Check authorization
    if (
      req.user.role === 'healthcare_worker' &&
      patient.assigned_worker_id !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Access denied',
        },
      });
    }

    res.json({
      success: true,
      data: {
        patient,
      },
    });
  } catch (error) {
    logger.error(`Get patient error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch patient',
      },
    });
  }
};

/**
 * Update patient
 */
const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const patient = await Patient.findById(id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Patient not found',
        },
      });
    }

    // Check authorization
    if (
      req.user.role === 'healthcare_worker' &&
      patient.assigned_worker_id !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Access denied',
        },
      });
    }

    const updatedPatient = await Patient.update(id, updates);

    logger.info(`Patient updated: ${id} by ${req.user.email}`);

    res.json({
      success: true,
      data: {
        patient: updatedPatient,
      },
    });
  } catch (error) {
    logger.error(`Update patient error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update patient',
      },
    });
  }
};

/**
 * Delete patient (soft delete)
 */
const deletePatient = async (req, res) => {
  try {
    const { id } = req.params;

    const patient = await Patient.findById(id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Patient not found',
        },
      });
    }

    await Patient.softDelete(id);

    logger.info(`Patient deleted: ${id} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Patient deleted successfully',
    });
  } catch (error) {
    logger.error(`Delete patient error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to delete patient',
      },
    });
  }
};

/**
 * Get patient assessment history
 */
const getPatientHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const patient = await Patient.findById(id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Patient not found',
        },
      });
    }

    const history = await Patient.getHistory(id, limit);

    res.json({
      success: true,
      data: {
        patient_id: id,
        history,
      },
    });
  } catch (error) {
    logger.error(`Get patient history error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch patient history',
      },
    });
  }
};

module.exports = {
  createPatient,
  getPatients,
  getPatient,
  updatePatient,
  deletePatient,
  getPatientHistory,
};

