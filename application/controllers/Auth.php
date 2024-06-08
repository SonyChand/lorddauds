<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Auth extends CI_Controller {
    public function __construct()
		{
			parent::__construct();
			date_default_timezone_set('Asia/Jakarta');
		}

	public function index()
	{
		if ($this->session->userdata('email')) {
			redirect('dashboard');
		}
		$data = [
            'title' => 'Login'
        ];

		$this->form_validation->set_rules('email', 'Email', 'trim|required|valid_email');
		$this->form_validation->set_rules('password', 'Password', 'trim|required');

			if ($this->form_validation->run() == false) {
				$this->load->view('templates/dashboard/auth/index', $data);
			} else {
				$this->_login();
				redirect('dashboard');
			}
        
	}

	public function logout()
		{
			$user = $this->db->get_where('user', ['email' => $this->session->userdata('email')])->row_array();
			$last_login = [
				'last_login' => time(),
				'stand_by' => 0
			];

			$this->db->set($last_login);
			$this->db->where('email', $this->session->userdata('email'));
			$this->db->update('user');

			$this->session->unset_userdata('name');
			$this->session->unset_userdata('email');
			$this->session->unset_userdata('role_id');

			$this->session->set_flashdata('message', '<div class="alert alert-success" role="alert">Logout Success!!</div>');
			redirect('auth');
		}

        private function _login()
		{

			$email = $this->input->post('email', true);
			$password = $this->input->post('password', true);
			$user = $this->db->get_where('user', ['email' => $email])->row_array();

			// jika usernya ada
			if ($user) {
				// jika usernya aktif
				if ($user['is_active'] == 1) {
					// cek password
					if (password_verify($password, $user['password'])) {

						$data = [
							'name' => $user['name'],
							'email' => $user['email'],
							'role_id' => $user['role_id']
						];
						$this->session->set_userdata($data);

						$last_login = [
							'last_login' => time(),
							'stand_by' => 1
						];

						$this->db->set($last_login);
						$this->db->where('email', $this->session->userdata('email'));
						$this->db->update('user');

					} else {
						$this->session->set_flashdata('message', '<div class="alert alert-danger" role="alert">Wrong Password!!</div>');
						redirect('auth');
					}
				} else {
					$this->session->set_flashdata('message', '<div class="alert alert-danger" role="alert">Email not Activated!!</div>');
					redirect('auth');
				}
			} else {
				$this->session->set_flashdata('message', '<div class="alert alert-danger" role="alert">Email not Registered!!</div>');
				redirect('auth');
			}
		}

}
