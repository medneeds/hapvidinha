# Project rules

- Patient edits go through `usePatients.updatePatient`, which applies them locally first, persists only changed fields (`getChangedPatientFields`) and queues saves per patient; background refetch/realtime must not overwrite a patient with saves in flight. Why: full-object saves without this caused quick successive entries to overwrite each other.
