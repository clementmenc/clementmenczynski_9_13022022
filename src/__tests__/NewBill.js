/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom"
import { localStorageMock } from "../__mocks__/localStorage.js";
import router from "../app/Router.js";
import store from "../__mocks__/store.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"


describe("Given I am connected as an employee", () => {

  const onNavigate = (pathname) => {
    document.body.innerHTML = ROUTES({ pathname })
  }

  beforeEach(() => {
    document.body.innerHTML = ""
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    window.localStorage.setItem('user', JSON.stringify({
      type: 'Employee'
    }))
    const root = document.createElement("div")
    root.setAttribute("id", "root")
    document.body.append(root)
    router()
    onNavigate('#employee/bill/new')

    jest.clearAllMocks();
  })

  describe('When I am on new bill page', () => {
    beforeEach(() => {
      document.body.innerHTML = ""
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)
    })

    test('Then,the new bill form is displayed', () => {
      expect(screen.getByTestId('form-new-bill')).toBeTruthy()
    })

    test("Then mail icon in vertical layout should be highlighted", async () => {
      await waitFor(() => screen.getByTestId('icon-mail'))
      const iconMail = screen.getByTestId('icon-mail')

      expect(iconMail.classList.contains("active-icon")).toBe(true)
    })
  })

  describe("When i upload a new file", () => {

    test("Then the handleChangeFile function and store create bills are called", () => {

      const spyStore = jest.spyOn(store, "bills");

      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage
      });


      const fileInput = screen.getByTestId('file');
      const handleChangeFile = jest.fn(newBill.handleChangeFile);

      fileInput.addEventListener('change', handleChangeFile);

      fireEvent.change(fileInput, {
        target: {
          files: [new File(['test.png'], 'test.png', { type: 'image/png' })]
        }
      })

      expect(handleChangeFile).toHaveBeenCalled();
      expect(spyStore).toHaveBeenCalled();
    })
    test('Then the store is not call if file is not a picture and the input file is cleared ', () => {

      const spyStore = jest.spyOn(store, "bills");

      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage
      });

      const fileInput = screen.getByTestId('file');
      const handleChangeFile = jest.fn(newBill.handleChangeFile);

      fileInput.addEventListener('change', handleChangeFile);

      fireEvent.change(fileInput, {
        target: {
          files: [new File(['test.pdf'], 'test.pdf', { type: 'application/pdf' })]
        }
      })

      expect(handleChangeFile).toHaveBeenCalled();
      expect(spyStore).not.toHaveBeenCalled();
      expect(fileInput.value).toEqual("");
    })
  })

  describe('When i submit the new bill form', () => {
    test('Then the handleSubmit function is called', () => {

      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage
      });

      const formNewBill = screen.getByTestId('form-new-bill');
      const handleSubmit = jest.fn(newBill.handleSubmit);

      formNewBill.addEventListener('submit', handleSubmit);

      fireEvent.submit(formNewBill);

      expect(handleSubmit).toHaveBeenCalled();
    })
  })

  describe('When I Post a New Bill and it\'s a succes', () => {
    test('Then the new bill is added', async () => {

      const spyStore = jest.spyOn(store, "bills");

      const newBill = {
        "id": "47qAXb6fIm2zOKkLzMro",
        "vat": "80",
        "fileUrl": "https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
        "status": "pending",
        "type": "Hôtel et logement",
        "commentary": "séminaire billed",
        "name": "encore",
        "fileName": "preview-facture-free-201801-pdf-1.jpg",
        "date": "2004-04-04",
        "amount": 400,
        "commentAdmin": "ok",
        "email": "a@a",
        "pct": 20
      }

      const defaultListOfBills = await store.bills().list();
      let expectedBillsCount = defaultListOfBills.length + 1;
      const result = await store.bills().create(newBill);

      expect(spyStore).toHaveBeenCalled();
      expect(result).toEqual({"fileUrl": "https://localhost:3456/images/test.jpg", "key": "1234"});
    })
  })

  describe('When I create a new bill and an error occurs', () => {
    test('Then the mock API fail with 404 message error', async () => {
      
      store.bills.mockImplementationOnce(() => {
        return {
          create: () => {
            return Promise.reject(new Error("Erreur 404"));
          }
        }
      })

      const html = ROUTES({ pathname: ROUTES_PATH['Bills'], error: "Erreur 404"})
      document.body.innerHTML = html

      const message = await screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    })

    test('Then the mock API fail with 500 message error', async () => {
      
      store.bills.mockImplementationOnce(() => {
        return {
          create: () => {
            return Promise.reject(new Error("Erreur 500"));
          }
        }
      })

      const html = ROUTES({ pathname: ROUTES_PATH['Bills'], error: "Erreur 500"})
      document.body.innerHTML = html

      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    })
  })
})
