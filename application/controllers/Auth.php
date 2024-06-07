<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Auth extends CI_Controller {
    public function __construct()
		{
			parent::__construct();
			// maintain();
			// include_once APPPATH . "../vendor/autoload.php";
			date_default_timezone_set('Asia/Jakarta');
		}

	public function index()
	{
		$data = [
            'title' => 'Login'
        ];

            // $this->load->view('templates/dashboard/header', $data);
            // $this->load->view('templates/dashboard/top-sidebar', $data);
            $this->load->view('templates/dashboard/auth/index', $data);
            // $this->load->view('templates/dashboard/footer');
        
	}

	public function logout()
		{
			$user = $this->db->get_where('pengguna', ['email' => $this->session->userdata('email')])->row_array();
			$last_login = [
				'terakhir_login' => time(),
				'aktif' => 0
			];

			$this->db->set($last_login);
			$this->db->where('email', $this->session->userdata('email'));
			$this->db->update('pengguna');

			histori('Logout', $user['nama'], $user['email'], 'telah melakukan logout', time(), 'primary');

			$this->session->unset_userdata('nama');
			$this->session->unset_userdata('email');
			$this->session->unset_userdata('role');
			$this->session->unset_userdata('wilayah');
			$this->session->unset_userdata('tahun');

			$this->session->set_flashdata('message', '<div class="alert alert-success" role="alert">Anda telah logout!</div>');
			redirect('welcome');
		}
        private function _login()
		{

			$email = $this->input->post('email', true);
			$password = $this->input->post('password', true);
			$user = $this->db->get_where('user', ['email' => $email])->row_array();

			// jika usernya ada
			if ($user) {
				// jika usernya aktif
				if ($user['status'] == 'Y') {
					// cek password
					if (password_verify($password, $user['password'])) {

						$data = [
							'nama' => $user['nama'],
							'email' => $user['email'],
							'role' => $user['role'],
							'wilayah' => $user['wilayah']
						];
						$this->session->set_userdata($data);

						$last_login = [
							'terakhir_login' => time(),
							'aktif' => 1
						];

						$this->db->set($last_login);
						$this->db->where('email', $this->session->userdata('email'));
						$this->db->update('pengguna');

						histori('Login', $user['name'], $user['email'], 'telah melakukan login', time(), 'primary');
					} else {
						$this->session->set_flashdata('message', '<div class="alert alert-danger" role="alert">Password Salah!!</div>');
						redirect('welcome');
					}
				} else {
					$this->session->set_flashdata('message', '<div class="alert alert-danger" role="alert">Email belum diaktivasi, Hubungi Operator Anda!!</div>');
					redirect('welcome');
				}
			} else {
				$this->session->set_flashdata('message', '<div class="alert alert-danger" role="alert">Email tidak terdaftar!!</div>');
				redirect('welcome');
			}
		}

}
