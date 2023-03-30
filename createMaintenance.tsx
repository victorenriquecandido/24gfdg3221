import React, { useEffect, useState } from "react";

import { Chip, Divider, Grid, Toolbar, Typography } from "@material-ui/core";

import Dialog from "../../../components/Dialog";
import InputChipList from "../../../components/InputChipList";
import { Formik, yupToFormErrors } from "formik";

import moment from "moment";
import * as Yup from "yup";

import { IconButtonStyled, ArrowBackIconStyled, Form, TitleForm, AddIconStyled } from "./styles";

import RequestServices from "../../../services/Request";
import RequestModel from "../../../models/Request";
import { useAuth } from "../../../services/session";
import api from "../../../services/api";
import AutoComplete from "../../../components/Autocomplete";
import { SubTitleContent } from "../execution/styles";

import Input, { InputArea } from "../../../components/Input";
import SelectComponent from "../../../components/Select";
import RadioGroup from "../../../components/RadioGroup";
import Button from "../../../components/Button";
import { ReponseDialog } from "../../../components/Dialog";
import { makeStyles } from "@material-ui/core";

import Notify from "../../../services/notify";

import ptBR from "date-fns/locale/pt-BR";
import DateFnsUtils from "@date-io/date-fns";
import { KeyboardDatePicker, MuiPickersUtilsProvider } from "@material-ui/pickers";
import { Add, Close } from "@material-ui/icons";
import { PartsMaterials } from "../PartsMaterial";
import notify from "../../../services/notify";

interface MaintenanceUI {
  open: boolean;
  openDialog?: any;
  closeDialog: any;
  requestServices: InstanceType<typeof RequestServices>;
  updateList: any;
}

const useStyles = makeStyles({
  defaultButton: {
    background: "#DC0032",
    color: "#FFFFFF",
    "&:hover": {
      background: "#DC0032",
    },
  },
  cancelButtonOutlined: {
    background: "#FFFFFF",
    border: "1px solid #C2002C",
    color: "#C2002C",
    "&:hover": {
      background: "#FFFFFF",
    },
  },
  ButtonOutlined: {
    background: "#FFFFFF",
    border: "1px solid #C0C0C0",
    color: "#C2002C",
    "&:hover": {
      background: "#FFFFFF",
    },
  },
  cancelButton: {
    background: "#FFFFFF",
    color: "#DC0032",
    "&:hover": {
      background: "#FFFFFF",
    },
  },
});

const maxLengthRM: number = 7;
const maxQtdRM: number = 5;

const CreateMaintenance: React.FC<MaintenanceUI> = ({ open, closeDialog, requestServices, updateList }) => {
  const classes = useStyles();
  const { session, authProfile } = useAuth();

  const [machines, setMachines] = useState([]);
  const [machine_id, setSelectedMachine] = useState<any>(null);
  const [serviceProviders, setServiceProviders] = useState([]);

  const [openRequestResponseDialog, setOpenRequestResponseDialog] = useState(true);

  const optionRadio = [
    { label: "Sim", value: "1" },
    { label: "Não", value: "0" },
  ];

  let optionTypeSymptom = [
    { label: "Corretiva", value: 1 },
    { label: "Corretiva Programada", value: 2 },
    { label: "Preventiva", value: 3 },
  ];
  if (authProfile("Analista Técnico")) optionTypeSymptom = optionTypeSymptom.filter((e: any) => e.value !== 1);

  const requestModel = new RequestModel(session);

  const handleSubmit = async (values: any, { setSubmitting }: any) => {
    setSubmitting(true);

    const res = await requestServices.create(JSON.parse(JSON.stringify(values)), authProfile("Analista Técnico"));
    if (res) {
      updateList();
      closeDialog();
      setOpenRequestResponseDialog(true);
    }
  };

  useEffect(() => {
    listMachines();
    listServiceProviders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function listMachines() {
    await api({
      method: "get",
      url: "/machines",
    }).then(function (response) {
      if (authProfile("Solicitante")) {
        setMachines(
          response.data.filter((machine: any) => machine?.cost_center_id === session.user.cost_center_id)
        );
      } else {
        setMachines(response.data);
      }
    });
  }

  async function listServiceProviders() {
    await api({
      method: "get",
      url: "/serviceproviders",
    }).then(function (response) {
      setServiceProviders(response.data);
    });
  }

  const selectOptions = [
    {
      value: 1,
      label: "Interna",
    },
    {
      value: 2,
      label: "Externa",
    },
  ];

  let formKeys = ["machine_id", "service_provider_id", "type_request", "problem", "line_stopped", "type_symptom"];

  if (authProfile("Analista Técnico")) {
    formKeys = formKeys.filter((e) => e !== "line_stopped");
    formKeys.push("scheduling_date");
    formKeys.push("partMaterialFlag");
    formKeys.push("partsMaterials");
    formKeys.push("getRM");
  }

  return (
    <>
      <ReponseDialog
        message="Solicitação realizada com sucesso"
        open={openRequestResponseDialog}
        onClose={() => setOpenRequestResponseDialog(false)}
      />
      <Dialog fullScreen open={open} onClose={closeDialog}>
        <Toolbar>
          <IconButtonStyled edge="start" color="inherit" onClick={closeDialog} aria-label="close">
            <ArrowBackIconStyled />
          </IconButtonStyled>
          <SubTitleContent onClick={closeDialog} style={{ cursor: "pointer", color: "#284B63" }}>
            Sair
          </SubTitleContent>
        </Toolbar>

        <Formik
          initialValues={requestModel.getInitialValues()}
          validationSchema={requestModel.getValidation(formKeys)}
          onSubmit={handleSubmit}
        >
          {props => {
            const {
              values,
              touched,
              errors,
              handleChange,
              handleBlur,
              handleSubmit,
              isSubmitting,
              setFieldValue,
            } = props;

            return (
              <Form onSubmit={handleSubmit}>
                <Grid container>
                  <Grid item xs={6}>
                    <TitleForm>Solicitante</TitleForm>
                    <SubTitleContent>
                      {`${session.user.username} - ${session.user.registration} `}
                    </SubTitleContent>
                  </Grid>

                  <Grid item xs={6} style={{ display: "flex", justifyContent: "right" }}>
                    <TitleForm style={{ fontSize: 22 }}>Nova Solicitação</TitleForm>
                  </Grid>
                </Grid>

                <Divider
                  style={{
                    margin: "2rem 0",
                  }}
                />
                <TitleForm
                  style={{
                    margin: "1.5rem 0",
                  }}
                >
                  Informações da Solicitação
                </TitleForm>

                <Grid container spacing={2}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <AutoComplete
                        style={{
                          display: "block",
                          // marginRight: "2rem",
                        }}
                        options={machines}
                        getOptionLabel={machine => `${machine.tag_code} - ${machine.name}`}
                        getOptionSelected={(option, value) => option.id === value.id}
                        onChange={(_, value) => {
                          setFieldValue("machine_id", value);
                          setSelectedMachine(value);
                        }}
                        renderInput={params => (
                          <Input
                            {...params}
                            label="Máquinas"
                            placeholder="Selecione uma Máquina"
                            name="machine_id"
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={
                              Boolean(errors.machine_id) && Boolean(touched.machine_id)
                            }
                            helperText={touched.machine_id ? errors.machine_id : ""}
                            value={values?.machine_id}
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} md={8} style={{ marginBottom: 16 }}>
                      <Grid container spacing={2} style={{ marginLeft: "1rem" }}>
                        <Grid item xs={4}>
                          <Typography variant="h6">Setor</Typography>
                          <SubTitleContent>
                            {!!machine_id ? machine_id.costcenter.name : "----"}
                          </SubTitleContent>
                        </Grid>

                        <Grid item xs={4}>
                          <Typography
                            variant="h6"
                            style={{
                              margin: "0rem",
                            }}
                          >
                            Área
                          </Typography>
                          <SubTitleContent>
                            {!!machine_id ? machine_id.line.area.name : "----"}
                          </SubTitleContent>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography
                            variant="h6"
                            style={{
                              margin: "0rem",
                            }}
                          >
                            Linha
                          </Typography>
                          <SubTitleContent>
                            {!!machine_id ? machine_id.line.name : "----"}
                          </SubTitleContent>
                        </Grid>
                      </Grid>
                    </Grid>

                    {!authProfile("Solicitante") && (
                      <Grid item xs={12} sm={6} md={3}>
                        <SelectComponent
                          fullWidth
                          name="type_request"
                          handleChange={handleChange}
                          value={values.type_request}
                          disabled={
                            !authProfile(["Analista Técnico", "Técnico Designado"])
                          }
                          label="Tipo da solicitação"
                          options={selectOptions}
                          onBlur={handleBlur}
                          error={
                            Boolean(errors.type_request) && Boolean(touched.type_request)
                          }
                          helperText={touched.type_request ? errors.type_request : ""}
                        />
                      </Grid>
                    )}

                    {!authProfile(["Solicitante", "Técnico Designado"]) && (
                      <Grid item xs={12} sm={6} md={3}>
                        <SelectComponent
                          fullWidth
                          name="type_symptom"
                          handleChange={handleChange}
                          value={values.type_symptom}
                          disabled={!authProfile("Analista Técnico")}
                          label="Tipo de sintoma"
                          options={optionTypeSymptom}
                          onBlur={handleBlur}
                          error={
                            Boolean(errors.type_symptom) && Boolean(touched.type_symptom)
                          }
                          helperText={touched.type_symptom ? errors.type_symptom : ""}
                        />
                      </Grid>
                    )}

                    {authProfile("Analista Técnico") && (
                      <Grid item xs={12} sm={6} md={3}>
                        <MuiPickersUtilsProvider utils={DateFnsUtils} locale={ptBR}>
                          <KeyboardDatePicker
                            fullWidth
                            name="scheduling_date"
                            autoOk
                            variant="inline"
                            inputVariant="outlined"
                            label="Data da manutenção"
                            minDate={moment(new Date()).startOf("days").add(1, "days")}
                            onBlur={handleBlur}
                            error={
                              Boolean(errors.scheduling_date) && !!touched.scheduling_date
                            }
                            helperText={
                              touched.scheduling_date ? errors.scheduling_date : ""
                            }
                            onChange={date => {
                              setFieldValue("scheduling_date", moment(date).endOf("day"))
                            }}
                            format="dd/MM/yyyy"
                            value={values.scheduling_date}
                            InputAdornmentProps={{ position: "end" }}
                          />
                        </MuiPickersUtilsProvider>
                      </Grid>
                    )}
                    {!authProfile("Solicitante") && (
                      <Grid item xs={12} sm={6} md={3}>
                        <AutoComplete
                          fullWidth
                          options={serviceProviders}
                          getOptionLabel={provider => provider.name}
                          getOptionSelected={(option, value) => option.name === value.name}
                          onChange={(event, value) => {
                            setFieldValue("service_provider_id", value);
                          }}
                          style={{ width: undefined, marginBottom: undefined }}
                          renderInput={params => (
                            <Input
                              {...params}
                              style={{ width: "100%" }}
                              label="Prestador de serviço"
                              placeholder="Selecione um prestador de serviço"
                              name="service_provider_id"
                              onChange={handleChange}
                              onBlur={handleBlur}
                              error={
                                !!errors.service_provider_id &&
                                !!touched.service_provider_id
                              }
                              helperText={
                                touched.service_provider_id
                                  ? errors.service_provider_id
                                  : ""
                              }
                              value={values?.service_provider_id}
                            />
                          )}
                        />
                      </Grid>
                    )}

                    {!authProfile("Analista Técnico") && (
                      <Grid item xs={12} sm={6} md={3}>
                        <RadioGroup
                          value={values?.line_stopped}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          props={{
                            error: !!errors.line_stopped && !!touched.line_stopped,
                            helperText: touched.line_stopped ? errors.line_stopped : "",
                          }}
                          name="line_stopped"
                          title="Houve parada de linha?*"
                          options={optionRadio}
                        />
                      </Grid>
                    )}

                    {authProfile("Analista Técnico") && (
                      <Grid item xs={12}>
                        <Grid item container direction="row" spacing={2} alignItems="center">
                          <Grid item>
                            <TitleForm style={{ marginBottom: "0rem" }}>
                              Solicitação de peças
                            </TitleForm>
                          </Grid>
                          <Grid item>
                            <RadioGroup
                              value={values?.partMaterialFlag}
                              options={optionRadio}
                              name="partMaterialFlag"
                              onChange={handleChange}
                              props={{
                                error: !!errors.partMaterialFlag && !!touched.partMaterialFlag,
                                helperText: touched.partMaterialFlag ? errors.partMaterialFlag : ""
                              }}
                            />
                          </Grid>
                        </Grid>
                        <Grid item container spacing={2}>
                          <Grid item>
                            <Input
                              size="medium"
                              label={values?.partMaterialFlag === "1" ? "Código da solicitação*" : "Código da solicitação"}
                              style={{ width: "18.5rem" }}
                              name="getRM"
                              onChange={({target}) => setFieldValue('getRM', target.value.replace(/\D/g, ""))}
                              onBlur={handleBlur}
                              value={values?.getRM}
                              disabled={values?.partMaterialFlag === "0"}
                              error={Boolean(errors.partsMaterials) && !!touched.partsMaterials}
                              helperText={touched.partsMaterials ? errors.partsMaterials : ""}
                              inputProps={{ maxLength: 7 }}
                            />
                          </Grid>
                          <Grid item>
                            <Button
                              className={classes.ButtonOutlined}
                              startIcon={<Add />}
                              disabled={values?.partMaterialFlag === "0" || values?.getRM.length === 0 || values?.partsMaterials.length === 5 || values?.getRM === "0"}
                              onClick={() => {
                                const rm = values?.getRM.padStart(7, '0');
                                if (!values?.partsMaterials.find((el: any) => el.code_requisition === rm)) {
                                  setFieldValue("partsMaterials", [...values?.partsMaterials, { code_requisition: rm }]);
                                  setFieldValue("getRM", "");
                                } else {
                                  notify.push({
                                    variant: "warning",
                                    title: "Atenção",
                                    message: "Já existe uma RM com este código",
                                  });
                                }
                              }}
                              style={{ marginTop: ".6rem" }}
                            >
                              Adicionar
                            </Button>
                          </Grid>
                        </Grid>
                        {values?.partsMaterials.length > 0 && values?.partMaterialFlag === "1" && (
                          <Grid item container direction="row" spacing={2}>
                            {values?.partsMaterials.map((partMaterial: any) => {
                              return (
                                <Grid item>
                                  <Chip
                                    deleteIcon={
                                      <Close style={{ color: "#FFFFFF" }} />
                                    }
                                    onDelete={() => {
                                      const data = partMaterial.code_requisition;
                                      setFieldValue(
                                        "partsMaterials",
                                        values?.partsMaterials.filter(
                                          (el: any) => el.code_requisition !== data
                                        )
                                      );
                                    }}
                                    label={partMaterial.code_requisition}
                                    style={{
                                      background: "#C2002C",
                                      color: "#FFFFFF",
                                      transition: "ease",
                                      transitionDuration: "0.3s",
                                    }}
                                  />
                                </Grid>
                              );
                            })}
                          </Grid>
                        )}
                      </Grid>
                    )}

                    <Grid item xs={12}>
                      <TitleForm
                        style={{
                          margin: "1rem 0",
                        }}
                      >
                        Descrição do problema
                      </TitleForm>
                      <InputArea
                        fullWidth
                        inputProps={{ maxLength: 2000 }}
                        name="problem"
                        onBlur={handleBlur}
                        error={Boolean(errors.problem) && !!touched.problem}
                        helperText={
                          touched.problem ? errors.problem : "Limite máximo de 2000 caracteres"
                        }
                        label="Descreva o problema"
                        value={values?.problem}
                        placeholder="Descreva o problema"
                        onChange={handleChange}
                      />
                    </Grid>
                  </Grid>

                  <Grid container justifyContent="center" style={{ marginTop: 16, marginBottom: 16 }}>
                    <Button
                      onClick={closeDialog}
                      size="large"
                      className={classes.ButtonOutlined}
                      style={{
                        marginRight: ".5rem",
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      size="large"
                      className={classes.defaultButton}
                      style={{
                        marginLeft: ".5rem",
                      }}
                      disabled={isSubmitting}
                    >
                      Solicitar
                    </Button>
                  </Grid>
                </Grid>
              </Form>
            );
          }}
        </Formik>
      </Dialog>
    </>
  );
};

export default CreateMaintenance;
